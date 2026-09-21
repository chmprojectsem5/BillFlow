/**
 * Formats integer paise into an INR currency string.
 * Example: 10000 -> ₹100.00
 * @param {number} paise 
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (paise) => {
  if (paise === null || paise === undefined || isNaN(paise)) return '₹0.00';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
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
