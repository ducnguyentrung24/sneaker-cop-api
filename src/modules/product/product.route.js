const express = require('express');
const router = express.Router();

const { ROLES } = require("../../constants/role.constant");
const productController = require('./product.controller');
const {
    authenticate,
    authorizeRoles,
} = require("../../middleware/auth.middleware");
const { validateProduct } = require("./product.validate");

// PUBLIC
router.get("/", productController.getProducts);

router.get("/:id", productController.getProductById);


// ADMIN
router.post("/",
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    validateProduct,
    productController.createProduct
);

router.put("/:id",
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    validateProduct,
    productController.updateProduct
);

router.delete("/:id",
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    productController.deleteProduct
);

module.exports = router;