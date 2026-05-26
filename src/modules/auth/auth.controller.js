const authService = require("./auth.service");

const register = async (req, res) => {
    try {
        const user = await authService.register(req.body);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const login = async (req, res) => {
    try {
        const result = await authService.login(req.body);

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const result = await authService.forgotPassword(req.body.email);

        res.status(200).json({
            success: true,
            message: "OTP has been sent to your email",
            data: result,
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            success: false,
            message: error.message,
            data: {
                remaining_seconds: error.remaining_seconds || 0,
            },
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const result = await authService.resetPassword(req.body);

        res.status(200).json({
            success: true,
            message: "Password reset successfully",
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
};