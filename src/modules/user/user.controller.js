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

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
};