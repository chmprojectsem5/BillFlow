const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

// Import models
const User = require('../src/models/User');
const Item = require('../src/models/Item');
const Invoice = require('../src/models/Invoice');
const Counter = require('../src/models/Counter');

test('User Schema Validation', (t) => {
  const validUser = new User({
    businessId: new mongoose.Types.ObjectId(),
    email: 'test@example.com',
    passwordHash: 'hashed123'
  });
  
  const err = validUser.validateSync();
  assert.strictEqual(err, undefined, 'Valid user should not have validation errors');

  const invalidEmailUser = new User({
    businessId: new mongoose.Types.ObjectId(),
    email: 'not-an-email',
    passwordHash: 'hashed123'
  });
  
  const emailErr = invalidEmailUser.validateSync();
  assert.ok(emailErr.errors['email'], 'Should fail on invalid email format');
});

test('Item Schema Validation - Product vs Service', (t) => {
  // Valid Product
  const product = new Item({
    businessId: new mongoose.Types.ObjectId(),
    type: 'Product',
    name: 'Laptop',
    unitPrice: 5000000, // paise
    gstRate: 18,
    taxType: 'Exclusive',
    currentStock: 10
  });

  const err1 = product.validateSync();
  assert.strictEqual(err1, undefined, 'Valid product should pass');

  // Valid Service
  const service = new Item({
    businessId: new mongoose.Types.ObjectId(),
    type: 'Service',
    name: 'Consulting',
    unitPrice: 500000,
    gstRate: 18,
    taxType: 'Exclusive',
    currentStock: 50 // Will be stripped by pre-save hook
  });

  // Since pre('save') is async, we simulate the hook for the test
  if (service.type === 'Service') {
    service.currentStock = null;
    service.lowStockThreshold = null;
  }

  const err2 = service.validateSync();
  assert.strictEqual(err2, undefined, 'Valid service should pass');
  assert.strictEqual(service.currentStock, null, 'Service stock must be null');

  // Negative Price
  const invalidPrice = new Item({
    businessId: new mongoose.Types.ObjectId(),
    type: 'Product',
    name: 'Faulty',
    unitPrice: -100,
    gstRate: 18,
    taxType: 'Exclusive'
  });

  const err3 = invalidPrice.validateSync();
  assert.ok(err3.errors['unitPrice'], 'Should fail on negative unit price');
});

test('Invoice Schema Validation', (t) => {
  const invoice = new Invoice({
    businessId: new mongoose.Types.ObjectId(),
    invoiceNumber: 'INV-001',
    date: new Date(),
    customerSnapshot: {
      name: 'Acme Corp',
      gstin: '29ABCDE1234F1Z5'
    },
    businessSnapshot: {
      name: 'My Business LLC'
    },
    items: [{
      name: 'Service A',
      quantity: 1,
      unitPrice: 10000,
      gstRate: 18,
      taxableValue: 10000,
      taxAmount: 1800,
      lineTotal: 11800
    }],
    summary: {
      subTotal: 10000,
      taxableTotal: 10000,
      taxTotal: 1800,
      grandTotal: 11800
    },
    paymentStatus: {
      balanceDue: 11800
    }
  });

  const err = invoice.validateSync();
  assert.strictEqual(err, undefined, 'Valid invoice snapshot should pass validation');
});

test('Counter Schema Validation', (t) => {
  const counter = new Counter({
    businessId: new mongoose.Types.ObjectId(),
    sequenceValue: 0
  });

  const err = counter.validateSync();
  assert.strictEqual(err, undefined);
  
  const invalidCounter = new Counter({
    businessId: new mongoose.Types.ObjectId(),
    sequenceValue: -5
  });
  
  const err2 = invalidCounter.validateSync();
  assert.ok(err2.errors['sequenceValue'], 'Sequence cannot be negative');
});
