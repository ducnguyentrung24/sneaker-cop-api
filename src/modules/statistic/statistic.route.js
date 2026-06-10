const express = require('express');
const router = express.Router();

const statisticController = require('./statistic.controller');

const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');
const { ROLES } = require('../../constants/role.constant');

router.get('/summary',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    statisticController.getStatisticSummary
);

router.get('/revenue-chart',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    statisticController.getRevenueChart
);

router.get('/top-products',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    statisticController.getTopProducts
);

router.get('/revenue-categories',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    statisticController.getRevenueByCategory
);

router.get('/low-stock-products',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    statisticController.getLowStockProducts
);

router.get('/recent-orders',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    statisticController.getRecentOrders
);

module.exports = router;