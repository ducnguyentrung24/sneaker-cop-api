const express = require('express');
const router = express.Router();

const orderController = require('./order.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { 
    validateCheckoutBuyNow,
    validateCheckoutCart,
    validateCheckoutReorder
} = require('./order.validate');

router.post('/checkout/cart',
    authenticate, 
    validateCheckoutCart, 
    orderController.checkoutFromCart
);

router.post('/checkout/buy-now',
    authenticate, 
    validateCheckoutBuyNow, 
    orderController.checkoutFromBuyNow
);

router.post('/checkout/reorder',
    authenticate,
    orderController.checkoutFromReorder
);

router.get('/', authenticate, orderController.getMyOrders);

router.get('/:id', authenticate, orderController.getOrderDetail);

router.patch('/:id/cancel', authenticate, orderController.cancelOrder);

module.exports = router;