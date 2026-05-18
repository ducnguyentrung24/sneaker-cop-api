const express = require('express');
const router = express.Router();

const orderController = require('../order/order.controller');
const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');

const { ROLES } = require('../../constants/role.constant');

router.get('/orders',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    orderController.getAllOrders
);

router.patch('/orders/:id/status',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    orderController.updateOrderStatus
);

module.exports = router;