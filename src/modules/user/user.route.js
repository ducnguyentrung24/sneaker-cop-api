const express = require('express');
const router = express.Router();

const userController = require('./user.controller');
const {
    validateUpdateProfile,
    validateChangePassword,
} = require('./user.validate');

const { authenticate } = require('../../middleware/auth.middleware');

router.get('/profile', authenticate, userController.getProfile);

router.patch('/profile',
    authenticate,
    validateUpdateProfile,
    userController.updateProfile
);

router.patch('/change-password',
    authenticate,
    validateChangePassword,
    userController.changePassword
);

module.exports = router;