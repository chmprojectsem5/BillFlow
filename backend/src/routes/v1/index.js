const express = require('express');
const healthRoute = require('./health.route');
const authRoute = require('./auth.route');

const router = express.Router();

router.use('/health', healthRoute);
router.use('/auth', authRoute);

// Future routes will be mounted here:
// router.use('/businesses', businessRoute);
// router.use('/invoices', invoiceRoute);

module.exports = router;
