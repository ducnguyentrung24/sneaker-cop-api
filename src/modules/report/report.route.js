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

module.exports = router;