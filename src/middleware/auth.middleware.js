const jwt = require("../utils/jwt");

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verifyToken(token);
        req.user = decoded;

        if (req.user.status === false) {
            return res.status(403).json({
                success: false,
                message: "Your account has been locked. Please contact support.",
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized token",
        });
    }

};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You don't have permission to access this resource",
            });
        }

        next();
    }
}

module.exports = {
    authenticate,
    authorizeRoles,
};