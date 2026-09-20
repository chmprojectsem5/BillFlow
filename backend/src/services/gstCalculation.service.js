/**
 * BillFlow-Pro — Centralized GST Calculation Engine
 * 
 * ROUNDING POLICY:
 * All monetary values are in integer paise.
 * When percentage calculations produce fractional paise, 
 * we use Math.round() for deterministic rounding (round half up).
 * This policy is applied consistently across all calculations.
 * 
 * DISCLAIMER:
 * This is a project-level tax calculation utility.
 * It does NOT constitute legal or professional tax advice.
 * GST rates and rules are configurable reference data.
 */

const AppError = require('../utils/AppError');

/**
 * Supported supply types for GST component split.
 */
const SUPPLY_TYPE = {
  INTRA_STATE: 'INTRA_STATE',
  INTER_STATE: 'INTER_STATE'
};

/**
 * Supported pricing modes.
 */
const PRICING_MODE = {
  EXCLUSIVE: 'EXCLUSIVE',
  INCLUSIVE: 'INCLUSIVE'
};

/**
 * Supported tax treatments.
 */
const TAX_TREATMENT = {
  TAXABLE: 'TAXABLE',
  NIL_RATED: 'NIL_RATED',
  EXEMPT: 'EXEMPT',
  NON_GST: 'NON_GST'
};

/**
 * Validates calculation input.
 * @param {Object} input
 * @throws {AppError} on invalid input
 */
const validateInput = (input) => {
  const { amountPaise, gstRate, pricingMode, supplyType, taxTreatment } = input;

  if (!Number.isInteger(amountPaise) || amountPaise < 0) {
    throw new AppError('amountPaise must be a non-negative integer', 400);
  }

  if (typeof gstRate !== 'number' || gstRate < 0 || gstRate > 100) {
    throw new AppError('gstRate must be a number between 0 and 100', 400);
  }

  if (!Object.values(PRICING_MODE).includes(pricingMode)) {
    throw new AppError(`pricingMode must be one of: ${Object.values(PRICING_MODE).join(', ')}`, 400);
  }

  if (!Object.values(SUPPLY_TYPE).includes(supplyType)) {
    throw new AppError(`supplyType must be one of: ${Object.values(SUPPLY_TYPE).join(', ')}`, 400);
  }

  if (taxTreatment && !Object.values(TAX_TREATMENT).includes(taxTreatment)) {
    throw new AppError(`taxTreatment must be one of: ${Object.values(TAX_TREATMENT).join(', ')}`, 400);
  }
};

/**
 * Calculate GST for a given amount.
 * 
 * @param {Object} input
 * @param {number} input.amountPaise - Base amount (exclusive) or total amount (inclusive) in paise
 * @param {number} input.gstRate - GST rate as a percentage (e.g. 18 for 18%)
 * @param {string} input.pricingMode - 'EXCLUSIVE' or 'INCLUSIVE'
 * @param {string} input.supplyType - 'INTRA_STATE' or 'INTER_STATE'
 * @param {string} [input.taxTreatment='TAXABLE'] - Tax treatment classification
 * 
 * @returns {Object} Deterministic GST calculation result with all values in integer paise
 */
const calculateGST = (input) => {
  const {
    amountPaise,
    gstRate,
    pricingMode,
    supplyType,
    taxTreatment = TAX_TREATMENT.TAXABLE
  } = input;

  validateInput(input);

  // For non-taxable treatments, return zero GST
  if (taxTreatment !== TAX_TREATMENT.TAXABLE) {
    const taxableAmount = pricingMode === PRICING_MODE.INCLUSIVE ? amountPaise : amountPaise;
    return {
      taxableAmount,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalGST: 0,
      total: taxableAmount,
      gstRate: 0,
      effectiveGstRate: 0,
      pricingMode,
      supplyType,
      taxTreatment
    };
  }

  // For 0% GST rate (taxable but zero-rated)
  if (gstRate === 0) {
    return {
      taxableAmount: amountPaise,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalGST: 0,
      total: amountPaise,
      gstRate: 0,
      effectiveGstRate: 0,
      pricingMode,
      supplyType,
      taxTreatment
    };
  }

  let taxableAmount;
  let totalGST;

  if (pricingMode === PRICING_MODE.EXCLUSIVE) {
    // Exclusive: amount IS the taxable value
    taxableAmount = amountPaise;
    // totalGST = taxableAmount * (gstRate / 100), rounded to integer paise
    totalGST = Math.round(taxableAmount * gstRate / 100);
  } else {
    // Inclusive: amount includes GST, need to reverse-calculate
    // taxable = inclusiveAmount * 100 / (100 + gstRate)
    taxableAmount = Math.round(amountPaise * 100 / (100 + gstRate));
    totalGST = amountPaise - taxableAmount;
  }

  // Component split
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (supplyType === SUPPLY_TYPE.INTRA_STATE) {
    // CGST + SGST: each is half of total GST
    // Split evenly; if odd paise, CGST gets the extra paise
    cgst = Math.ceil(totalGST / 2);
    sgst = totalGST - cgst;
  } else {
    // INTER_STATE: entire GST is IGST
    igst = totalGST;
  }

  const total = taxableAmount + totalGST;

  return {
    taxableAmount,
    cgst,
    sgst,
    igst,
    totalGST,
    total,
    gstRate,
    effectiveGstRate: gstRate,
    pricingMode,
    supplyType,
    taxTreatment
  };
};

/**
 * Determine supply type based on seller and customer states.
 * This is a basic determination — it does NOT cover all legal place-of-supply rules.
 * 
 * @param {string} sellerState
 * @param {string} customerState
 * @returns {string} INTRA_STATE or INTER_STATE
 */
const determineSupplyType = (sellerState, customerState) => {
  if (!sellerState || !customerState) {
    // Default to intra-state if states are not configured
    return SUPPLY_TYPE.INTRA_STATE;
  }
  const normalize = (s) => s.trim().toLowerCase();
  return normalize(sellerState) === normalize(customerState)
    ? SUPPLY_TYPE.INTRA_STATE
    : SUPPLY_TYPE.INTER_STATE;
};

module.exports = {
  calculateGST,
  determineSupplyType,
  SUPPLY_TYPE,
  PRICING_MODE,
  TAX_TREATMENT
};
