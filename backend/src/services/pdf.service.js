const path = require('path');
const PdfPrinter = require('pdfmake/js/Printer').default || require('pdfmake/js/Printer');
const URLResolver = require('pdfmake/js/URLResolver').default || require('pdfmake/js/URLResolver');

// Configure Roboto TrueType fonts so Unicode characters (specifically INR ₹) render natively without glyph corruption
const robotoDir = path.join(__dirname, '../../node_modules/pdfmake/fonts/Roboto');
const fonts = {
  Roboto: {
    normal: path.join(robotoDir, 'Roboto-Regular.ttf'),
    bold: path.join(robotoDir, 'Roboto-Medium.ttf'),
    italics: path.join(robotoDir, 'Roboto-Italic.ttf'),
    bolditalics: path.join(robotoDir, 'Roboto-MediumItalic.ttf')
  },
  // Keep Helvetica fallback pointing to standard or Roboto
  Helvetica: {
    normal: path.join(robotoDir, 'Roboto-Regular.ttf'),
    bold: path.join(robotoDir, 'Roboto-Medium.ttf'),
    italics: path.join(robotoDir, 'Roboto-Italic.ttf'),
    bolditalics: path.join(robotoDir, 'Roboto-MediumItalic.ttf')
  }
};

const printer = new PdfPrinter(fonts, null, new URLResolver(null));

function formatIndianIntegerString(intStr) {
  if (intStr.length <= 3) return intStr;
  const lastThree = intStr.slice(-3);
  const rest = intStr.slice(0, -3);
  const parts = [];
  let i = rest.length;
  while (i > 0) {
    const start = Math.max(0, i - 2);
    parts.unshift(rest.slice(start, i));
    i = start;
  }
  return parts.join(',') + ',' + lastThree;
}

const formatCurrency = (val, { isOptional = false } = {}) => {
  if (val === null || val === undefined || val === '') {
    return isOptional ? '-' : '-';
  }

  const str = String(val).trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(str)) {
    return '[Invalid Amount]';
  }

  const isNeg = str.startsWith('-');
  const absStr = isNeg ? str.slice(1) : str;
  const [intPart, decPart = ''] = absStr.split('.');
  const paddedDec = (decPart + '00').slice(0, 2);
  const formattedInt = formatIndianIntegerString(intPart);

  return `${isNeg ? '-' : ''}₹${formattedInt}.${paddedDec}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const safeImageNode = (logoData) => {
  if (!logoData || typeof logoData !== 'string') return null;
  if (logoData.startsWith('data:image/')) {
    return { image: logoData, width: 85, alignment: 'right', margin: [0, 0, 0, 6] };
  }
  return null;
};

/**
 * Generate PDF stream from authoritative invoice data.
 * Does NOT perform any financial calculations.
 * Formats canonical rupee amounts into INR strings with ₹ symbol.
 */
const generateInvoicePdf = async (invoice) => {
  const { businessSnapshot, customerSnapshot, summary, items, paymentStatus } = invoice;

  const isB2B = invoice.billingMode === 'GST-Registered' || Boolean(customerSnapshot?.gstin);
  const statusUpper = (invoice.status || 'UNPAID').toUpperCase();

  // Status badge colors
  let statusColor = '#374151';
  let statusBg = '#F3F4F6';
  if (statusUpper === 'PAID') {
    statusColor = '#065F46'; // emerald-800
    statusBg = '#D1FAE5';    // emerald-100
  } else if (statusUpper === 'PARTIALLY PAID') {
    statusColor = '#92400E'; // amber-800
    statusBg = '#FEF3C7';    // amber-100
  } else if (statusUpper === 'UNPAID') {
    statusColor = '#1E40AF'; // blue-800
    statusBg = '#DBEAFE';    // blue-100
  } else if (statusUpper === 'OVERDUE') {
    statusColor = '#991B1B'; // red-800
    statusBg = '#FEE2E2';    // red-100
  }

  // Build items table body
  // Exact column widths sum to 531pt (A4 printable width with 32pt margins: 595.28 - 64 = 531.28pt)
  const tableBody = [
    [
      { text: 'Sr.', style: 'tableHeader', alignment: 'center' },
      { text: 'Item Details', style: 'tableHeader', alignment: 'left' },
      { text: 'HSN/SAC', style: 'tableHeader', alignment: 'center' },
      { text: 'Qty', style: 'tableHeader', alignment: 'right' },
      { text: 'Rate', style: 'tableHeader', alignment: 'right' },
      { text: 'Disc.', style: 'tableHeader', alignment: 'right' },
      { text: 'Taxable', style: 'tableHeader', alignment: 'right' },
      { text: 'GST%', style: 'tableHeader', alignment: 'center' },
      { text: 'GST Amt', style: 'tableHeader', alignment: 'right' },
      { text: 'Total', style: 'tableHeader', alignment: 'right' }
    ]
  ];

  if (items && items.length > 0) {
    items.forEach((item, index) => {
      tableBody.push([
        { text: String(index + 1), style: 'tableCell', alignment: 'center' },
        {
          text: [
            { text: item.name, bold: true, fontSize: 8.5 },
            ...(item.description ? ['\n', { text: item.description, fontSize: 7.5, color: '#6B7280' }] : [])
          ],
          style: 'tableCell',
          alignment: 'left'
        },
        { text: item.hsnSac || '-', style: 'tableCell', alignment: 'center', noWrap: true },
        { text: `${item.quantity}${item.unit ? ' ' + item.unit : ''}`, style: 'tableCell', alignment: 'right', noWrap: true },
        { text: formatCurrency(item.unitPrice), style: 'tableCell', alignment: 'right', noWrap: true },
        { text: item.discount > 0 ? formatCurrency(item.discount) : '-', style: 'tableCell', alignment: 'right', noWrap: true },
        { text: formatCurrency(item.taxableValue), style: 'tableCell', alignment: 'right', bold: true, noWrap: true },
        { text: `${item.gstRate}%`, style: 'tableCell', alignment: 'center', noWrap: true },
        { text: formatCurrency(item.taxAmount), style: 'tableCell', alignment: 'right', noWrap: true },
        { text: formatCurrency(item.lineTotal), style: 'tableCell', alignment: 'right', bold: true, noWrap: true }
      ]);
    });
  }

  const docDefinition = {
    defaultStyle: {
      font: 'Roboto',
      fontSize: 9,
      color: '#1F2937',
      lineHeight: 1.2
    },
    pageSize: 'A4',
    pageMargins: [32, 32, 32, 36],
    content: [
      // 1. BUSINESS HEADER & DOCUMENT TITLE
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: businessSnapshot.name, style: 'businessTitle' },
              businessSnapshot.address ? { text: businessSnapshot.address, style: 'businessDetail' } : null,
              (businessSnapshot.city || businessSnapshot.state) ? {
                text: [businessSnapshot.city, businessSnapshot.state, businessSnapshot.pincode].filter(Boolean).join(', '),
                style: 'businessDetail'
              } : null,
              businessSnapshot.gstin ? {
                text: [
                  { text: 'GSTIN: ', bold: true, color: '#374151' },
                  { text: businessSnapshot.gstin, bold: true }
                ],
                style: 'businessDetail',
                margin: [0, 2, 0, 0]
              } : null,
              (businessSnapshot.phone || businessSnapshot.email) ? {
                text: [
                  businessSnapshot.phone ? `Phone: ${businessSnapshot.phone}` : '',
                  businessSnapshot.email ? `Email: ${businessSnapshot.email}` : ''
                ].filter(Boolean).join('   •   '),
                style: 'businessDetail',
                color: '#6B7280'
              } : null
            ].filter(Boolean)
          },
          {
            width: 190,
            stack: [
              safeImageNode(businessSnapshot.logo),
              {
                text: invoice.status === 'Draft' ? 'DRAFT INVOICE' : (isB2B ? 'TAX INVOICE' : 'INVOICE'),
                style: 'documentTitle'
              },
              {
                text: isB2B ? 'TAX INVOICE (B2B)' : 'GENERAL INVOICE',
                style: 'documentSubtitle'
              }
            ].filter(Boolean),
            alignment: 'right'
          }
        ]
      },

      // Accent Divider line (matches 531pt printable width)
      { canvas: [{ type: 'line', x1: 0, y1: 10, x2: 531, y2: 10, lineWidth: 1.5, lineColor: '#4F46E5' }] },

      // 2. INVOICE META GRID
      {
        margin: [0, 16, 0, 14],
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              {
                stack: [
                  { text: 'INVOICE NO.', style: 'metaLabel' },
                  { text: invoice.invoiceNumber, style: 'metaValue', bold: true }
                ]
              },
              {
                stack: [
                  { text: 'INVOICE DATE', style: 'metaLabel' },
                  { text: formatDate(invoice.date), style: 'metaValue' }
                ]
              },
              {
                stack: [
                  { text: invoice.dueDate ? 'DUE DATE' : 'INVOICE TYPE', style: 'metaLabel' },
                  { text: invoice.dueDate ? formatDate(invoice.dueDate) : (isB2B ? 'GST-Registered' : 'General Walk-in'), style: 'metaValue' }
                ]
              },
              {
                stack: [
                  { text: 'STATUS', style: 'metaLabel' },
                  {
                    text: statusUpper,
                    style: 'statusBadge',
                    color: statusColor,
                    background: statusBg
                  }
                ]
              }
            ]
          ]
        },
        layout: {
          fillColor: '#F9FAFB',
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#E5E7EB',
          vLineColor: () => '#E5E7EB',
          paddingTop: () => 6,
          paddingBottom: () => 6,
          paddingLeft: () => 8,
          paddingRight: () => 8
        }
      },

      // 3. BILL TO & PLACE OF SUPPLY
      {
        margin: [0, 0, 0, 16],
        columns: [
          {
            width: 320,
            stack: [
              {
                text: isB2B ? 'BILL TO (REGISTERED RECIPIENT)' : 'CUSTOMER / RECIPIENT',
                style: 'sectionHeading'
              },
              { text: customerSnapshot?.name || 'Walk-in / Counter Sale', bold: true, fontSize: 11, color: '#111827', margin: [0, 2, 0, 2] },
              customerSnapshot?.billingAddress ? { text: customerSnapshot.billingAddress, style: 'customerDetail' } : null,
              (customerSnapshot?.city || customerSnapshot?.state || customerSnapshot?.pinCode) ? {
                text: [customerSnapshot.city, customerSnapshot.state, customerSnapshot.pinCode].filter(Boolean).join(', '),
                style: 'customerDetail'
              } : null,
              customerSnapshot?.phone ? { text: `Phone: ${customerSnapshot.phone}`, style: 'customerDetail' } : null,
              customerSnapshot?.email ? { text: `Email: ${customerSnapshot.email}`, style: 'customerDetail' } : null,
              (isB2B && customerSnapshot?.gstin) ? {
                text: [{ text: 'GSTIN: ', bold: true }, { text: customerSnapshot.gstin, bold: true }],
                style: 'customerDetail',
                margin: [0, 2, 0, 0]
              } : null,
              (isB2B && customerSnapshot?.pan) ? {
                text: [{ text: 'PAN: ', bold: true }, { text: customerSnapshot.pan, bold: true }],
                style: 'customerDetail'
              } : null
            ].filter(Boolean)
          },
          {
            width: 203,
            table: {
              widths: ['*'],
              body: [
                [
                  {
                    stack: [
                      { text: 'PLACE OF SUPPLY (POS)', style: 'posLabel' },
                      {
                        text: (() => {
                          const pos = invoice.placeOfSupply || customerSnapshot?.placeOfSupply || customerSnapshot?.state || 'Same as Supplier';
                          const code = invoice.placeOfSupplyStateCode || customerSnapshot?.placeOfSupplyStateCode;
                          return code ? `${pos} (${code})` : pos;
                        })(),
                        bold: true,
                        fontSize: 10,
                        color: '#1E1B4B',
                        margin: [0, 2, 0, 4]
                      },
                      {
                        text: (summary.igstTotal > 0)
                          ? 'Inter-state Supply (IGST Applicable)'
                          : 'Intra-state Supply (CGST + SGST Applicable)',
                        fontSize: 7.5,
                        color: (summary.igstTotal > 0) ? '#6B21A8' : '#047857',
                        bold: true
                      }
                    ]
                  }
                ]
              ]
            },
            layout: {
              fillColor: '#F5F3FF',
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              hLineColor: () => '#DDD6FE',
              vLineColor: () => '#DDD6FE',
              paddingTop: () => 8,
              paddingBottom: () => 8,
              paddingLeft: () => 10,
              paddingRight: () => 10
            }
          }
        ]
      },

      // 4. ITEMS TABLE (Proportional 531pt total)
      {
        margin: [0, 0, 0, 16],
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: [16, '*', 42, 28, 44, 36, 48, 26, 44, 56],
          body: tableBody
        },
        layout: {
          fillColor: function (rowIndex) {
            if (rowIndex === 0) return '#F3F4F6';
            return (rowIndex % 2 === 0) ? '#FAFAFA' : '#FFFFFF';
          },
          hLineWidth: function (i, node) {
            if (i === 0 || i === 1 || i === node.table.body.length) return 1;
            return 0.5;
          },
          vLineWidth: () => 0,
          hLineColor: function (i, node) {
            if (i === 0 || i === 1 || i === node.table.body.length) return '#D1D5DB';
            return '#E5E7EB';
          },
          paddingTop: () => 5,
          paddingBottom: () => 5,
          paddingLeft: () => 2.5,
          paddingRight: () => 2.5
        }
      },

      // 5. TOTALS & SUMMARY SECTION (Side-by-side, 531pt total)
      {
        columns: [
          // Left: Tax Summary Box & Payment Status
          {
            width: 260,
            stack: [
              (summary.taxTotal > 0) ? {
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    [
                      { text: 'TAX BREAKDOWN', colSpan: 2, style: 'boxHeading' },
                      {}
                    ],
                    ...(Number(summary.cgstTotal) > 0 ? [[
                      { text: 'Central GST (CGST)', style: 'taxBreakupLabel' },
                      { text: formatCurrency(summary.cgstTotal), style: 'taxBreakupValue' }
                    ]] : []),
                    ...(Number(summary.sgstTotal) > 0 ? [[
                      { text: 'State GST (SGST)', style: 'taxBreakupLabel' },
                      { text: formatCurrency(summary.sgstTotal), style: 'taxBreakupValue' }
                    ]] : []),
                    ...(Number(summary.igstTotal) > 0 ? [[
                      { text: 'Integrated GST (IGST)', style: 'taxBreakupLabel' },
                      { text: formatCurrency(summary.igstTotal), style: 'taxBreakupValue' }
                    ]] : []),
                    [
                      { text: 'Total Tax Amount', bold: true, fontSize: 8.5, color: '#111827', margin: [0, 4, 0, 2] },
                      { text: formatCurrency(summary.taxTotal), bold: true, fontSize: 8.5, alignment: 'right', margin: [0, 4, 0, 2] }
                    ]
                  ]
                },
                layout: {
                  fillColor: '#F9FAFB',
                  hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length - 1 || i === node.table.body.length) ? 0.75 : 0.5,
                  vLineWidth: () => 0.75,
                  hLineColor: () => '#E5E7EB',
                  vLineColor: () => '#E5E7EB',
                  paddingTop: () => 4,
                  paddingBottom: () => 4,
                  paddingLeft: () => 8,
                  paddingRight: () => 8
                }
              } : { text: '' },

              // Payment Status card if available
              paymentStatus ? {
                margin: [0, 8, 0, 0],
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    [
                      { text: 'PAYMENT STATUS', colSpan: 2, style: 'boxHeading' },
                      {}
                    ],
                    [
                      { text: 'Amount Paid', style: 'taxBreakupLabel' },
                      { text: formatCurrency(paymentStatus.paidAmount || 0), style: 'taxBreakupValue', color: '#047857', bold: true }
                    ],
                    [
                      { text: 'Balance Due', style: 'taxBreakupLabel', bold: true },
                      {
                        text: formatCurrency(paymentStatus.balanceDue || 0),
                        style: 'taxBreakupValue',
                        color: Number(paymentStatus.balanceDue) > 0 ? '#B91C1C' : '#047857',
                        bold: true
                      }
                    ]
                  ]
                },
                layout: {
                  fillColor: '#F9FAFB',
                  hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.75 : 0.5,
                  vLineWidth: () => 0.75,
                  hLineColor: () => '#E5E7EB',
                  vLineColor: () => '#E5E7EB',
                  paddingTop: () => 3,
                  paddingBottom: () => 3,
                  paddingLeft: () => 8,
                  paddingRight: () => 8
                }
              } : null
            ].filter(Boolean)
          },

          // Center gap
          { width: 15, text: '' },

          // Right: Financial Summary Totals
          {
            width: 256,
            table: {
              widths: ['*', 'auto'],
              body: [
                [
                  { text: 'Subtotal', style: 'totalsLabel' },
                  { text: formatCurrency(summary.subTotal), style: 'totalsValue' }
                ],
                ...(summary.discountTotal > 0 ? [[
                  { text: 'Discount', style: 'totalsLabel', color: '#DC2626' },
                  { text: `-${formatCurrency(summary.discountTotal)}`, style: 'totalsValue', color: '#DC2626' }
                ]] : []),
                [
                  { text: 'Taxable Amount', style: 'totalsLabel' },
                  { text: formatCurrency(summary.taxableTotal), style: 'totalsValue' }
                ],
                [
                  { text: 'GST', style: 'totalsLabel' },
                  { text: formatCurrency(summary.taxTotal), style: 'totalsValue' }
                ],
                [
                  { text: 'GRAND TOTAL', bold: true, fontSize: 11, color: '#312E81', margin: [0, 8, 0, 8] },
                  { text: formatCurrency(summary.grandTotal), bold: true, fontSize: 13, color: '#4338CA', alignment: 'right', margin: [0, 8, 0, 8] }
                ]
              ]
            },
            layout: {
              fillColor: (rowIndex, node) => (rowIndex === node.table.body.length - 1) ? '#EEF2FF' : null,
              hLineWidth: function (i, node) {
                if (i === node.table.body.length - 1 || i === node.table.body.length) return 1.5;
                return 0.5;
              },
              vLineWidth: () => 0,
              hLineColor: function (i, node) {
                if (i === node.table.body.length - 1 || i === node.table.body.length) return '#6366F1';
                return '#E5E7EB';
              },
              paddingTop: () => 4.5,
              paddingBottom: () => 4.5,
              paddingLeft: () => 6,
              paddingRight: () => 6
            }
          }
        ]
      },

      // 6. NOTES, TERMS & AUTHORIZED SIGNATORY
      {
        margin: [0, 24, 0, 0],
        columns: [
          {
            width: 320,
            stack: [
              invoice.notes ? {
                stack: [
                  { text: 'NOTES', style: 'boxHeading' },
                  { text: invoice.notes, fontSize: 8, color: '#4B5563', margin: [0, 2, 0, 8] }
                ]
              } : null,
              invoice.terms ? {
                stack: [
                  { text: 'TERMS & CONDITIONS', style: 'boxHeading' },
                  { text: invoice.terms, fontSize: 8, color: '#4B5563', margin: [0, 2, 0, 0] }
                ]
              } : null
            ].filter(Boolean)
          },
          {
            width: 203,
            stack: [
              { text: `For ${businessSnapshot.name}`, bold: true, fontSize: 8.5, alignment: 'right', color: '#111827' },
              { text: '\n\n\n' },
              {
                canvas: [{ type: 'line', x1: 60, y1: 0, x2: 203, y2: 0, lineWidth: 1, lineColor: '#9CA3AF' }]
              },
              { text: 'Authorized Signatory', fontSize: 8, alignment: 'right', color: '#4B5563', margin: [0, 3, 0, 0] }
            ]
          }
        ]
      }
    ],

    footer: function (currentPage, pageCount) {
      return {
        margin: [36, 12, 36, 0],
        columns: [
          {
            text: 'This is a computer generated invoice.',
            fontSize: 7.5,
            color: '#9CA3AF'
          },
          {
            text: `Page ${currentPage} of ${pageCount}`,
            fontSize: 7.5,
            color: '#9CA3AF',
            alignment: 'right'
          }
        ]
      };
    },

    styles: {
      businessTitle: {
        fontSize: 16,
        bold: true,
        color: '#111827',
        margin: [0, 0, 0, 3]
      },
      businessDetail: {
        fontSize: 8.5,
        color: '#4B5563',
        margin: [0, 1, 0, 1]
      },
      documentTitle: {
        fontSize: 22,
        bold: true,
        color: '#4F46E5',
        margin: [0, 0, 0, 2]
      },
      documentSubtitle: {
        fontSize: 7.5,
        bold: true,
        color: '#6B7280',
        letterSpacing: 0.5
      },
      metaLabel: {
        fontSize: 7,
        bold: true,
        color: '#6B7280',
        letterSpacing: 0.5,
        margin: [0, 0, 0, 2]
      },
      metaValue: {
        fontSize: 9,
        color: '#111827'
      },
      statusBadge: {
        fontSize: 8,
        bold: true,
        alignment: 'center',
        margin: [0, 1, 0, 0]
      },
      sectionHeading: {
        fontSize: 7.5,
        bold: true,
        color: '#6B7280',
        letterSpacing: 0.5,
        margin: [0, 0, 0, 3]
      },
      customerDetail: {
        fontSize: 8.5,
        color: '#4B5563',
        margin: [0, 1, 0, 1]
      },
      posLabel: {
        fontSize: 7,
        bold: true,
        color: '#5B21B6',
        letterSpacing: 0.5,
        margin: [0, 0, 0, 2]
      },
      tableHeader: {
        fontSize: 7.5,
        bold: true,
        color: '#374151'
      },
      tableCell: {
        fontSize: 8,
        color: '#1F2937'
      },
      boxHeading: {
        fontSize: 7.5,
        bold: true,
        color: '#4B5563',
        letterSpacing: 0.5,
        margin: [0, 0, 0, 3]
      },
      taxBreakupLabel: {
        fontSize: 8,
        color: '#4B5563'
      },
      taxBreakupValue: {
        fontSize: 8,
        alignment: 'right',
        color: '#111827'
      },
      totalsLabel: {
        fontSize: 8.5,
        color: '#4B5563'
      },
      totalsValue: {
        fontSize: 8.5,
        alignment: 'right',
        color: '#111827',
        bold: true
      }
    }
  };

  const pdfDoc = await printer.createPdfKitDocument(docDefinition);

  return pdfDoc;
};

module.exports = {
  generateInvoicePdf
};
