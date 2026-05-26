const express = require("express");
const router = express.Router();

const authController = require("./auth.controller");
const {
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
} = require("./auth.validate");

router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.post("/forgot-password", validateForgotPassword, authController.forgotPassword);
router.post("/reset-password", validateResetPassword, authController.resetPassword);

module.exports = router;