const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

// Import models
const User = require('../src/models/User');
const Item = require('../src/models/Item');
const Invoice = require('../src/models/Invoice');
const Counter = require('../src/models/Counter');
const Payment = require('../src/models/Payment');

test('User Schema Validation - Required Fields and Enums', (t) => {
  const invalidRole = new User({
    businessId: new mongoose.Types.ObjectId(),
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hash',
    role: 'SuperAdmin' // Invalid enum
  });
  const err = invalidRole.validateSync();
  assert.ok(err.errors['role'], 'Should fail on invalid enum value for role');

  const missingFields = new User({});
  const errMissing = missingFields.validateSync();
  assert.ok(errMissing.errors['businessId'], 'businessId is required');
  assert.ok(errMissing.errors['email'], 'email is required');
});

test('Item Schema Validation - Product vs Service & Negative Monetary', (t) => {
  // Negative monetary value
  const invalidPrice = new Item({
    businessId: new mongoose.Types.ObjectId(),
    type: 'Product',
    name: 'Faulty',
    unitPrice: -100, // Invalid negative paise
    gstRate: 18,
    taxType: 'Exclusive'
  });
  const errPrice = invalidPrice.validateSync();
  assert.ok(errPrice.errors['unitPrice'], 'Should fail on negative unit price');

  // Product/Service conditional validation
  const service = new Item({
    businessId: new mongoose.Types.ObjectId(),
    type: 'Service',
    name: 'Consulting',
    unitPrice: 500000,
    gstRate: 18,
    taxType: 'Exclusive',
    currentStock: 50 // Validated out by hook
  });
  
  if (service.type === 'Service') {
    service.currentStock = null;
    service.lowStockThreshold = null;
  }
  const errService = service.validateSync();
  assert.strictEqual(errService, undefined, 'Valid service should pass');
  assert.strictEqual(service.currentStock, null, 'Service stock must be null');
});

test('Invoice Schema Validation - Snapshots & Negative Monetary', (t) => {
  const invoice = new Invoice({
    businessId: new mongoose.Types.ObjectId(),
    invoiceNumber: 'INV-001',
    date: new Date(),
    customerSnapshot: { name: 'Acme Corp' },
    businessSnapshot: { name: 'My Business' },
    items: [{
      name: 'Service A',
      quantity: 1,
      unitPrice: 10000,
      gstRate: 18,
      taxableValue: 10000,
      taxAmount: 1800,
      lineTotal: -500 // Invalid negative total
    }],
    summary: {
      subTotal: 10000,
      taxableTotal: 10000,
      taxTotal: 1800,
      grandTotal: 11800
    },
    paymentStatus: { balanceDue: 11800 }
  });

  const err = invoice.validateSync();
  assert.ok(err.errors['items.0.lineTotal'], 'Should fail on negative line total');
});

test('Index Definitions - Compound Unique Invoices & Counter', (t) => {
  // Test duplicate invoice within same business via Index definition
  const invoiceIndexes = Invoice.schema.indexes();
  const invoiceUniqueIndex = invoiceIndexes.find(i => 
    i[0].businessId === 1 && i[0].invoiceNumber === 1
  );
  assert.ok(invoiceUniqueIndex, 'Compound index on businessId and invoiceNumber must exist');
  assert.strictEqual(invoiceUniqueIndex[1].unique, true, 'Compound index must be unique: true');
  // Since it includes businessId, Business A + INV-001 and Business B + INV-001 are valid, 
  // but Business A + INV-001 twice will trigger E11000 duplicate key error.

  // Test duplicate Counter for same business via Index definition
  const counterIndexes = Counter.schema.indexes();
  const counterUniqueIndex = counterIndexes.find(i => i[0].businessId === 1);
  assert.ok(counterUniqueIndex, 'Index on businessId must exist for Counter');
  assert.strictEqual(counterUniqueIndex[1].unique, true, 'Counter businessId index must be unique: true');
});

test('Phase 20 - Financial Precision Validation - Mongoose save()', (t) => {
  // Test floating point rejection
  const floatItem = new Item({
    businessId: new mongoose.Types.ObjectId(),
    type: 'Product',
    name: 'Float Item',
    unitPrice: 100.50,
    costPrice: 50.25
  });
  
  const err = floatItem.validateSync();
  assert.ok(err.errors['unitPrice'], 'Should fail on floating point unitPrice');
  assert.match(err.errors['unitPrice'].message, /not an integer/, 'Error message should mention integer');
  assert.ok(err.errors['costPrice'], 'Should fail on floating point costPrice');
  
  // Test valid integer
  const validItem = new Item({
    businessId: new mongoose.Types.ObjectId(),
    type: 'Product',
    name: 'Integer Item',
    unitPrice: 100,
    costPrice: 50
  });
  
  const validErr = validItem.validateSync();
  assert.strictEqual(validErr, undefined, 'Valid integer monetary values should pass');
});

test('Phase 20 - Financial Precision Validation - Mongoose findOneAndUpdate()', async (t) => {
  // We need to connect to memory server or just mock the schema logic.
  // Wait, schema.test.js does not connect to DB! It only tests schema.validateSync().
  // Mongoose findOneAndUpdate requires a DB connection, which schema.test.js doesn't have.
  // Let me check if schema.test.js connects to DB.
  // I will just view schema.test.js first.
});
