const Joi = require('joi');

const updateProfileSchema = Joi.object({
    full_name: Joi.string().max(255).required().messages({
        "any.required": "Họ tên là bắt buộc",
    }),
    phone: Joi.string().optional().max(20).messages({
        "string.max": "Số điện thoại không được vượt quá 20 ký tự",
    }),
});

const changePasswordSchema = Joi.object({
    old_password: Joi.string().required().messages({
        "any.required": "Mật khẩu cũ là bắt buộc",
    }),
    new_password: Joi.string().min(6).required().messages({
        "string.min": "Mật khẩu mới phải có ít nhất 6 ký tự",
        "any.required": "Mật khẩu mới là bắt buộc",
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
    validateUpdateProfile: validate(updateProfileSchema),
    validateChangePassword: validate(changePasswordSchema),
};