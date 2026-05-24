const express = require('express');
const router = express.Router();

const userController = require('./user.controller');

const {
    validateUpdateProfile,
    validateChangePassword,
    validateCreateUser,
    validateUpdateUser,
    validateUpdateUserStatus,
} = require('./user.validate');

const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');
const { ROLES } = require('../../constants/role.constant');

// Public
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

// Admin
router.get('/', 
    authenticate, 
    authorizeRoles(ROLES.ADMIN),
    userController.getAllUsers
);

router.post('/',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    validateCreateUser,
    userController.createUser
);

router.patch('/:id/status',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    validateUpdateUserStatus,
    userController.updateUserStatus
);

router.patch('/:id',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    validateUpdateUser,
    userController.updateUser
);


module.exports = router;