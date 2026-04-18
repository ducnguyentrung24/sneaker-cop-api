const express = require('express');
const router = express.Router();

const orderController = require('./order.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validateCheckout } = require('./order.validate');

router.post('/',
    authenticate, 
    validateCheckout, 
    orderController.checkout
);

router.get('/', authenticate, orderController.getMyOrders);

router.get('/:id', authenticate, orderController.getOrderDetail);

router.patch('/:id/cancel', authenticate, orderController.cancelOrder);

module.exports = router;