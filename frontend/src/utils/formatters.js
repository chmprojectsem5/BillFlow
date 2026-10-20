/**
 * Formats an integer string with Indian numbering system grouping.
 * e.g., '100000' -> '1,00,000', '10000000' -> '1,00,00,000'
 * @param {string} intStr
 * @returns {string}
 */
export function formatIndianIntegerString(intStr) {
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

/**
 * Formats rupee amount string/number into an INR currency string.
 * Example: '1250.50' -> '₹1,250.50'
 * Example: 1250.5 -> '₹1,250.50'
 * Rejects values with more than 2 decimal places or malformed values by returning '[Invalid Amount]'.
 * @param {string|number} amount
 * @param {Object} [options]
 * @param {boolean} [options.isOptional=false]
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, { isOptional = false } = {}) => {
  if (amount === null || amount === undefined || amount === '') {
    return isOptional ? '-' : '₹0.00';
  }

  let str;
  if (typeof amount === 'number') {
    if (isNaN(amount) || !isFinite(amount)) return '[Invalid Amount]';
    str = amount.toFixed(2);
  } else {
    str = String(amount).trim();
  }

  if (!/^\d+(\.\d{1,2})?$/.test(str)) {
    return '[Invalid Amount]';
  }

  const [intPart, decPart = ''] = str.split('.');
  const paddedDec = (decPart + '00').slice(0, 2);
  const formattedInt = formatIndianIntegerString(intPart);

  return `₹${formattedInt}.${paddedDec}`;
};

/**
 * Formats an ISO date string into a localized readable date.
 * Example: '2026-09-21T00:00:00Z' -> '21 Sep 2026'
 * @param {string} dateString
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};
