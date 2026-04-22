const express = require('express');
const router = express.Router();

const orderController = require('./order.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validateCheckout } = require('./order.validate');

router.post('/checkout/cart',
    authenticate, 
    validateCheckout, 
    orderController.checkoutFromCart
);

router.post('/checkout/buy-now',
    authenticate, 
    validateCheckout, 
    orderController.checkoutFromBuyNow
);

router.get('/', authenticate, orderController.getMyOrders);

router.get('/:id', authenticate, orderController.getOrderDetail);

router.patch('/:id/cancel', authenticate, orderController.cancelOrder);

module.exports = router;