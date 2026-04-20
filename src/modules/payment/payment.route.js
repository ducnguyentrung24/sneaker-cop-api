const express = require('express');
const router = express.Router();

const paymentController = require('./payment.controller');

const { authenticate } = require('../../middleware/auth.middleware');

router.get('/vnpay/:orderId', paymentController.createPayment);

router.get('/vnpay-return', paymentController.vnpayReturn);

module.exports = router;