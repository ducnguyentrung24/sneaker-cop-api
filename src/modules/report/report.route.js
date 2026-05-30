const express = require("express");
const router = express.Router();

const reportController = require("./report.controller");

const { authenticate, authorizeRoles } = require("../../middleware/auth.middleware");
const { ROLES } = require("../../constants/role.constant");

router.get("/revenue-summary", 
    authenticate,
    authorizeRoles(ROLES.ADMIN), 
    reportController.getRevenueSummary
);

router.get("/revenue-product",
    authenticate,
    authorizeRoles(ROLES.ADMIN), 
    reportController.getRevenueByProduct
);

router.get("/revenue-brand",
    authenticate,
    authorizeRoles(ROLES.ADMIN), 
    reportController.getRevenueByBrand
);

router.get("/revenue-category",
    authenticate,
    authorizeRoles(ROLES.ADMIN), 
    reportController.getRevenueByCategory
);

router.get("/revenue-order",
    authenticate,
    authorizeRoles(ROLES.ADMIN), 
    reportController.getRevenueOrders
);

router.get("/revenue-excel",
    authenticate,
    authorizeRoles(ROLES.ADMIN), 
    reportController.exportRevenueExcel
);

module.exports = router;