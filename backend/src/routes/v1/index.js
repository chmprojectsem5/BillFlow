const express = require('express');
const healthRoute = require('./health.route');
const authRoute = require('./auth.route');
const businessRoute = require('./business.route');
const customerRoute = require('./customer.route');

const router = express.Router();

router.use('/health', healthRoute);
router.use('/auth', authRoute);
router.use('/business', businessRoute);
router.use('/customers', customerRoute);

// Future routes will be mounted here:
// router.use('/invoices', invoiceRoute);

module.exports = router;
