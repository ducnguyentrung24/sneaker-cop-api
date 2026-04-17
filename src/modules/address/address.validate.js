const Joi = require('joi');

const addressSchema = Joi.object({
    receiver_name: Joi.string().required().messages({
        "any.required": "Tên nguời nhận là bắt buộc",
        "string.empty": "Tên nguời nhận không được để trống"
    }),
    phone: Joi.string()
        .pattern(/^[0-9]{10,15}$/)
        .required()
        .messages({
            "any.required": "Số điện thoại là bắt buộc",
            "string.empty": "Số điện thoại không được để trống",
            "string.pattern.base": "Số điện thoại phải là chuỗi số từ 10 đến 15 chữ số"
        }),
    city: Joi.string().required().messages({
        "any.required": "Thành phố là bắt buộc",
        "string.empty": "Thành phố không được để trống"
    }),
    ward: Joi.string().required().messages({
        "any.required": "Phường/xã là bắt buộc",
        "string.empty": "Phường/xã không được để trống"
    }),
    detail_address: Joi.string().required().messages({
        "any.required": "Địa chỉ chi tiết là bắt buộc",
        "string.empty": "Địa chỉ chi tiết không được để trống"
    }),
    is_default: Joi.boolean().optional(),
});

const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: true,
        stripUnknown: true,
    }
    );

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message,
        });
    }

    req.body = value;

    next();
};

module.exports = {
    validateAddress: validate(addressSchema),
};