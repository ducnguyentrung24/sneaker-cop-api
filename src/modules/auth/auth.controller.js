const authService = require("./auth.service");
const jwt = require("jsonwebtoken");

const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth",
};

const setRefreshCookie = (res, refreshToken) => {
    const { exp } = jwt.decode(refreshToken);
    res.cookie("refreshToken", refreshToken, {
        ...refreshCookieOptions,
        expires: new Date(exp * 1000),
    });
};

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
        setRefreshCookie(res, result.refreshToken);

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: result.user,
                accessToken: result.accessToken,
            },
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const refresh = async (req, res) => {
    try {
        const result = await authService.refresh(req.cookies?.refreshToken);
        setRefreshCookie(res, result.refreshToken);
        res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            data: { accessToken: result.accessToken },
        });
    } catch (error) {
        res.clearCookie("refreshToken", refreshCookieOptions);
        res.status(401).json({
            success: false,
            message: "Invalid or expired refresh token",
        });
    }
};

const logout = (req, res) => {
    res.clearCookie("refreshToken", refreshCookieOptions);
    res.status(200).json({ success: true, message: "Logout successful" });
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
    refresh,
    logout,
    forgotPassword,
    resetPassword,
};
