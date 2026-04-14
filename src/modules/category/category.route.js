const express = require('express');
const router = express.Router();

const { ROLES } = require("../../constants/role.constant");
const categoryController = require("./category.controller");
const {
    authenticate,
    authorizeRoles,
} = require("../../middleware/auth.middleware");
const { validateCategory } = require("./category.validate");

// PUBLIC
router.get("/", categoryController.getCategories);

router.get("/:id", categoryController.getCategoryById);

// ADMIN
router.post("/",
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    validateCategory,
    categoryController.createCategory
);

router.put("/:id",
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