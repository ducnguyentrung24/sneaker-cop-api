const express = require("express");
const router = express.Router();

const brandController = require("./brand.controller");

const { validateBrand } = require("./brand.validate");

const {
    authenticate,
    authorizeRoles,
} = require("../../middleware/auth.middleware");
const { ROLES } = require("../../constants/role.constant");

// Public
router.get("/", brandController.getBrands);

router.get("/:id", brandController.getBrandById);

// Admin
router.post("/",
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    validateBrand,
    brandController.createBrand
);

router.patch("/:id",
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    validateBrand,
    brandController.updateBrand
);

router.delete("/:id",
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    validateBrand,
    brandController.deleteBrand
);

module.exports = router;