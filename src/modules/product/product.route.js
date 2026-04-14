const express = require('express');
const router = express.Router();

const { ROLES } = require("../../constants/role.constant");
const productController = require('./product.controller');
const {
    authenticate,
    authorizeRoles,
} = require("../../middleware/auth.middleware");
const { validateProduct } = require("./product.validate");


// ADMIN
router.post("/",
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    validateProduct,
    productController.createProduct
);

module.exports = router;