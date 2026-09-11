const express = require('express');
const healthRoute = require('./health.route');

const router = express.Router();

router.use('/health', healthRoute);

// Future routes will be mounted here:
// router.use('/auth', authRoute);
// router.use('/businesses', businessRoute);
// router.use('/invoices', invoiceRoute);

module.exports = router;
