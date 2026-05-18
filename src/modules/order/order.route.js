const express = require('express');
const router = express.Router();

const orderController = require('./order.controller');

const { 
    validateCheckoutBuyNow,
    validateCheckoutCart,
    validateCheckoutReorder
} = require('./order.validate');

const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');
const { ROLES } = require('../../constants/role.constant');

// Public
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

// Admin
router.get('/orders',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    orderController.getAllOrders
);

router.get('/orders/:id',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    orderController.getAdminOrderDetail
);

router.patch('/orders/:id/status',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    orderController.updateOrderStatus
);

module.exports = router;