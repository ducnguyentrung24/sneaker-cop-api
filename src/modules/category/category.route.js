const express = require('express');
const router = express.Router();

const categoryController = require("./category.controller");
const { ROLES } = require("../../constants/role.constant");

const { validateCategory } = require("./category.validate");

const {
    authenticate,
    authorizeRoles,
} = require("../../middleware/auth.middleware");

// Public
router.get("/", categoryController.getCategories);

router.get("/:id", categoryController.getCategoryById);

// Admin
router.post("/",
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    validateCategory,
    categoryController.createCategory
);

router.patch("/:id",
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    validateCategory,
    categoryController.updateCategory
);

router.delete("/:id",
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    validateCategory,
    categoryController.deleteCategory
);

module.exports = router;