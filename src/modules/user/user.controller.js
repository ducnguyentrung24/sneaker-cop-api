const userService = require('./user.service');

const getProfile = async (req, res) => {
    try {
        const user = await userService.getProfile(req.user.id);

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const user = await userService.updateProfile(
            req.user.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const result = await userService.changePassword(
            req.user.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: result,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// Admin
const getAllUsers = async (req, res) => {
    try {
        const result = await userService.getAllUsers(req.query);

        res.status(200).json({
            success: true,
            message: "Get users successfully",
            data: result
        })
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const createUser = async (req, res) => {
    try {
        const user = await userService.createUser(req.body);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const user = await userService.updateUser(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: user,
        });
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const user = await userService.updateUserStatus(
            req.params.id,
            req.body.is_active
        );

        res.status(200).json({
            success: true,
            message: user.is_active
                ? 'Unlock user successfully'
                : 'Lock user successfully',
            data: user,
        });
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    getAllUsers,
    createUser,
    updateUser,
    updateUserStatus,
};