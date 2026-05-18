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

module.exports = router;