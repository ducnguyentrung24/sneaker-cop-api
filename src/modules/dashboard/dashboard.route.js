const express = require('express');
const router = express.Router();

const dashboardController = require('./dashboard.controller');

const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');
const { ROLES } = require('../../constants/role.constant');

router.get('/',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    dashboardController.getDashboardSummary
);

router.get('/revenue-statistics',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    dashboardController.getRevenueStatistics
);

router.get('/top-products',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    dashboardController.getTopProducts
);

router.get('/low-stock',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    dashboardController.getLowStockProducts
);

router.get('/payment-statistics',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    dashboardController.getPaymentStatistics
);

router.get('/category-statistics',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    dashboardController.getCategoryStatistics
);

router.get('/brand-statistics',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    dashboardController.getBrandStatistics
);

module.exports = router;