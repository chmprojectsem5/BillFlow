const pdfmake = require('pdfmake');

// Define font configurations for pdfmake
pdfmake.fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const formatCurrency = (paise) => {
  if (paise === null || paise === undefined || isNaN(paise)) return '₹0.00';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

/**
 * Validates whether the logo string is likely base64 data URL or external URL, 
 * but for pdfmake's image prop to work safely with external URLs, we ideally need base64 or absolute paths.
 * Since we don't have a file storage system implemented and this is isolated, 
 * we'll safely wrap the logo processing in a try/catch if it causes issues, or just pass it in.
 * Pdfmake handles Data URLs (base64) out of the box. 
 * We will assume `businessSnapshot.logo` is a valid Data URL if it exists.
 */
const safeImageNode = (logoData) => {
  if (!logoData || typeof logoData !== 'string') return null;
  // Basic validation that it's a data URI. External URLs require fetching buffer.
  if (logoData.startsWith('data:image/')) {
    return { image: logoData, width: 100, alignment: 'right' };
  }
  return null;
};

/**
 * Generate PDF stream from authoritative invoice data.
 * Does NOT perform any financial calculations. 
 * Formats integer paise into INR strings.
 */
const generateInvoicePdf = async (invoice) => {
  const { businessSnapshot, customerSnapshot, summary, items } = invoice;

  // Build items table body
  const tableBody = [
    // Header row
    [
      { text: 'Sr. No.', style: 'tableHeader' },
      { text: 'Item Details', style: 'tableHeader' },
      { text: 'HSN/SAC', style: 'tableHeader', alignment: 'right' },
      { text: 'Qty', style: 'tableHeader', alignment: 'right' },
      { text: 'Rate', style: 'tableHeader', alignment: 'right' },
      { text: 'Discount', style: 'tableHeader', alignment: 'right' },
      { text: 'Taxable', style: 'tableHeader', alignment: 'right' },
      { text: 'GST%', style: 'tableHeader', alignment: 'right' },
      { text: 'GST Amt', style: 'tableHeader', alignment: 'right' },
      { text: 'Total', style: 'tableHeader', alignment: 'right' }
    ]
  ];

  if (items && items.length > 0) {
    items.forEach((item, index) => {
      tableBody.push([
        { text: (index + 1).toString(), style: 'tableCell' },
        { 
          text: [
            { text: item.name, bold: true },
            ...(item.description ? ['\n', { text: item.description, fontSize: 8, color: '#666666' }] : [])
          ], 
          style: 'tableCell'
        },
        { text: item.hsnSac || '-', style: 'tableCell', alignment: 'right' },
        { text: `${item.quantity} ${item.unit || ''}`, style: 'tableCell', alignment: 'right' },
        { text: formatCurrency(item.unitPrice), style: 'tableCell', alignment: 'right' },
        { text: item.discount > 0 ? formatCurrency(item.discount) : '-', style: 'tableCell', alignment: 'right' },
        { text: formatCurrency(item.taxableValue), style: 'tableCell', alignment: 'right' },
        { text: `${item.gstRate}%`, style: 'tableCell', alignment: 'right' },
        { text: formatCurrency(item.taxAmount), style: 'tableCell', alignment: 'right' },
        { text: formatCurrency(item.lineTotal), style: 'tableCell', alignment: 'right' }
      ]);
    });
  }

  const docDefinition = {
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 10,
      color: '#333333'
    },
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    content: [
      // HEADER
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: businessSnapshot.name, style: 'businessTitle' },
              businessSnapshot.address || '',
              businessSnapshot.state || '',
              businessSnapshot.gstin ? `GSTIN: ${businessSnapshot.gstin}` : ''
            ].filter(Boolean)
          },
          {
            width: 'auto',
            stack: [
              safeImageNode(businessSnapshot.logo),
              { text: invoice.status === 'Draft' ? 'DRAFT INVOICE' : 'INVOICE', style: 'documentTitle', alignment: 'right' }
            ].filter(Boolean)
          }
        ]
      },
      
      { canvas: [{ type: 'line', x1: 0, y1: 10, x2: 515, y2: 10, lineWidth: 1, lineColor: '#DDDDDD' }] },
      
      // INVOICE META & CUSTOMER
      {
        margin: [0, 20, 0, 20],
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'Bill To:', style: 'sectionLabel' },
              customerSnapshot ? {
                stack: [
                  { text: customerSnapshot.name, bold: true, fontSize: 12 },
                  customerSnapshot.billingAddress || '',
                  [customerSnapshot.city, customerSnapshot.state, customerSnapshot.pinCode].filter(Boolean).join(', '),
                  customerSnapshot.country || '',
                  customerSnapshot.gstin ? `GSTIN: ${customerSnapshot.gstin}` : '',
                  customerSnapshot.pan ? `PAN: ${customerSnapshot.pan}` : ''
                ].filter(Boolean)
              } : { text: 'N/A' }
            ]
          },
          {
            width: '50%',
            stack: [
              {
                columns: [
                  { text: 'Invoice No:', width: '50%', bold: true, alignment: 'right' },
                  { text: invoice.invoiceNumber, width: '50%', alignment: 'right' }
                ]
              },
              {
                columns: [
                  { text: 'Date:', width: '50%', bold: true, alignment: 'right' },
                  { text: formatDate(invoice.date), width: '50%', alignment: 'right' }
                ]
              },
              invoice.dueDate ? {
                columns: [
                  { text: 'Due Date:', width: '50%', bold: true, alignment: 'right' },
                  { text: formatDate(invoice.dueDate), width: '50%', alignment: 'right' }
                ]
              } : null,
              {
                columns: [
                  { text: 'Status:', width: '50%', bold: true, alignment: 'right' },
                  { text: invoice.status, width: '50%', alignment: 'right' }
                ]
              }
            ].filter(Boolean)
          }
        ]
      },

      // ITEMS TABLE
      {
        margin: [0, 10, 0, 20],
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: tableBody
        },
        layout: {
          fillColor: function (rowIndex) {
            return (rowIndex === 0) ? '#F3F4F6' : null;
          },
          hLineWidth: function (i, node) {
            return (i === 0 || i === node.table.body.length) ? 1 : 0.5;
          },
          vLineWidth: function () {
            return 0;
          },
          hLineColor: function () {
            return '#E5E7EB';
          }
        }
      },

      // TOTALS
      {
        columns: [
          { width: '*', text: '' }, // empty space on left
          {
            width: 250,
            table: {
              widths: ['*', 'auto'],
              body: [
                [ { text: 'Subtotal', margin: [0, 4, 0, 4] }, { text: formatCurrency(summary.subTotal), alignment: 'right', margin: [0, 4, 0, 4] } ],
                ...(summary.discountTotal > 0 ? [[ { text: 'Discount', margin: [0, 4, 0, 4], color: '#DC2626' }, { text: `-${formatCurrency(summary.discountTotal)}`, alignment: 'right', color: '#DC2626', margin: [0, 4, 0, 4] } ]] : []),
                [ { text: 'Taxable Amount', margin: [0, 4, 0, 4] }, { text: formatCurrency(summary.taxableTotal), alignment: 'right', margin: [0, 4, 0, 4] } ],
                [ { text: 'GST', margin: [0, 4, 0, 4] }, { text: formatCurrency(summary.taxTotal), alignment: 'right', margin: [0, 4, 0, 4] } ],
                [ { text: 'Grand Total', bold: true, fontSize: 12, margin: [0, 8, 0, 8] }, { text: formatCurrency(summary.grandTotal), bold: true, fontSize: 12, alignment: 'right', margin: [0, 8, 0, 8] } ]
              ]
            },
            layout: {
              hLineWidth: function (i, node) {
                if (i === node.table.body.length - 1 || i === node.table.body.length) return 2;
                return 0.5;
              },
              vLineWidth: function () { return 0; },
              hLineColor: function (i, node) {
                if (i === node.table.body.length - 1 || i === node.table.body.length) return '#111827';
                return '#E5E7EB';
              }
            }
          }
        ]
      },

      // NOTES & TERMS
      (invoice.notes || invoice.terms) ? {
        margin: [0, 40, 0, 0],
        stack: [
          invoice.notes ? { stack: [{ text: 'Notes', style: 'sectionLabel' }, { text: invoice.notes, fontSize: 9, margin: [0, 5, 0, 15] }] } : null,
          invoice.terms ? { stack: [{ text: 'Terms & Conditions', style: 'sectionLabel' }, { text: invoice.terms, fontSize: 9, margin: [0, 5, 0, 0] }] } : null
        ].filter(Boolean)
      } : null
    ].filter(Boolean),
    
    styles: {
      businessTitle: {
        fontSize: 18,
        bold: true,
        color: '#111827'
      },
      documentTitle: {
        fontSize: 24,
        bold: true,
        color: '#4F46E5', // indigo-600
        marginTop: 10
      },
      sectionLabel: {
        fontSize: 10,
        bold: true,
        color: '#6B7280',
        textTransform: 'uppercase'
      },
      tableHeader: {
        fontSize: 8,
        bold: true,
        color: '#4B5563',
        margin: [0, 5, 0, 5]
      },
      tableCell: {
        fontSize: 9,
        margin: [0, 5, 0, 5]
      }
    }
  };

  return await pdfmake.createPdf(docDefinition).getStream();
};

module.exports = {
  generateInvoicePdf
};
