const express = require("express");
const router = express.Router();

const { ROLES } = require("../../constants/role.constant");
const brandController = require("./brand.controller");
const {
    authenticate,
    authorizeRoles,
} = require("../../middleware/auth.middleware");
const { validateBrand } = require("./brand.validate");

// PUBLIC
router.get("/", brandController.getBrands);

router.get("/:id", brandController.getBrandById);

// ADMIN
router.post("/",
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    validateBrand,
    brandController.createBrand
);

router.put("/:id",
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