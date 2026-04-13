const Joi = require("joi");

const registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.base": "Email phải là chuỗi",
        "string.email": "Email không hợp lệ",
        "any.required": "Email là bắt buộc",
    }),
    password: Joi.string().min(6).required().messages({
        "string.base": "Mật khẩu phải là chuỗi",
        "string.min": "Mật khẩu phải có ít nhất 6 ký tự",
        "any.required": "Mật khẩu là bắt buộc",
    }),
    full_name: Joi.string().required().messages({
        "string.base": "Họ tên phải là chuỗi",
        "any.required": "Họ tên là bắt buộc",
    }),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.email": "Email không hợp lệ",
        "any.required": "Email là bắt buộc",
    }),
    password: Joi.string().required().messages({
        "any.required": "Mật khẩu là bắt buộc",
    }),
});

// Middleware factory
const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: true, // chỉ lấy lôi đầu tiên
        stripUnknown: true, // loại bỏ các trường không được định nghĩa
    });

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message,
        });
    }

    // Overwrite body đã clean
    req.body = value;

    next();
};

module.exports = {
    validateRegister: validate(registerSchema),
    validateLogin: validate(loginSchema),
};