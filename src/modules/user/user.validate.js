const Joi = require('joi');

const { ROLES } = require("../../constants/role.constant");

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

const createUserSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.base": "Email phải là chuỗi",
        "string.email": "Email không hợp lệ",
        "string.empty": "Email không được để trống",
        "any.required": "Email là bắt buộc",
    }),
    password: Joi.string().min(6).required().messages({
        "string.base": "Mật khẩu phải là chuỗi",
        "string.min": "Mật khẩu phải có ít nhất 6 ký tự",
        "string.empty": "Mật khẩu không được để trống",
        "any.required": "Mật khẩu là bắt buộc",
    }),
    full_name: Joi.string().required().messages({
        "string.base": "Họ tên phải là chuỗi",
        "string.empty": "Họ tên không được để trống",
        "any.required": "Họ tên là bắt buộc",
    }),
    phone: Joi.string()
            .pattern(/^[0-9]{10,15}$/)
            .optional()
            .allow('', null)
            .messages({
                "string.base": "Số điện thoại phải là chuỗi",
                "string.pattern.base": "Số điện thoại phải là chuỗi số từ 10 đến 15 chữ số"
            }),
    role: Joi.string()
            .valid(ROLES.ADMIN, ROLES.CUSTOMER)
            .default(ROLES.CUSTOMER)
            .messages({
                "string.base": "Vai trò phải là chuỗi",
                "any.only": "Vai trò không hợp lệ",
            }),
    is_active: Joi.boolean().default(true).messages({
        "boolean.base": "Trạng thái hoạt động phải là boolean",
    }),
});

const updateUserSchema = Joi.object({
    full_name: Joi.string().trim().messages({
        "string.base": "Họ tên phải là chuỗi",
        "string.empty": "Họ tên không được để trống",
    }),
    phone: Joi.string()
            .pattern(/^[0-9]{10,15}$/)
            .optional()
            .allow('', null)
            .messages({
                "string.base": "Số điện thoại phải là chuỗi",
                "string.pattern.base": "Số điện thoại phải là chuỗi số từ 10 đến 15 chữ số"
            }),
    role: Joi.string()
            .valid(ROLES.ADMIN, ROLES.CUSTOMER)
            .default(ROLES.CUSTOMER)
            .messages({
                "string.base": "Vai trò phải là chuỗi",
                "any.only": "Vai trò không hợp lệ",
            }),
});

const updateUserStatusSchema = Joi.object({
    is_active: Joi.boolean().required().messages({
        "boolean.base": "Trạng thái hoạt động phải là boolean",
        "any.required": "Trạng thái hoạt động là bắt buộc",
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
    validateCreateUser: validate(createUserSchema),
    validateUpdateUser: validate(updateUserSchema),
    validateUpdateUserStatus: validate(updateUserStatusSchema),
};