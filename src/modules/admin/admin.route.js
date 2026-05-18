const express = require('express');
const router = express.Router();

const { updateOrderStatus } = require('../order/order.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

router.patch('/orders/:id/status',
    authenticate,
    updateOrderStatus
);

module.exports = router;