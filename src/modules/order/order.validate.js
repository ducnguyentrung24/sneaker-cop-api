const Joi = require('joi');
const { paymentMethods } = require('../../constants/paymentMethod.constant');

const checkoutBuyNowSchema = Joi.object({
    variant_id: Joi.number().required().messages({
        'any.required': 'ID biến thể là bắt buộc',
    }),
    quantity: Joi.number().integer().min(1).required().messages({
        'any.required': 'Số lượng là bắt buộc',
        'number.base': 'Số lượng phải là một số',
        'number.integer': 'Số lượng phải là một số nguyên',
        'number.min': 'Số lượng phải lớn hơn hoặc bằng 1',
    }),
    address_id: Joi.number().required().messages({
        'any.required': 'ID địa chỉ là bắt buộc',
    }),
    payment_method: Joi.string()
        .valid(...Object.values(paymentMethods))
        .optional()
        .messages({
            'any.only': 'Phương thức thanh toán không hợp lệ',
        }),
    note: Joi.string().allow('').optional().messages({
        'string.base': 'Ghi chú phải là một chuỗi',
    }),
});

const checkoutCartSchema = Joi.object({
    address_id: Joi.number().required().messages({
        'any.required': 'ID địa chỉ là bắt buộc',
    }),
    selected_item_ids: Joi.array()
        .items(Joi.number().required())
        .min(1)
        .required()
        .messages({
            'any.required': 'Các mục đã chọn là bắt buộc',
            'array.base': 'Các mục đã chọn phải là một mảng',
            'array.min': 'Chọn ít nhất một sản phẩm trong giỏ hàng',
        }),
    payment_method: Joi.string()
        .valid(...Object.values(paymentMethods))
        .optional()
        .messages({
            'any.only': 'Phương thức thanh toán không hợp lệ',
        }),
    note: Joi.string().allow('').optional().messages({
        'string.base': 'Ghi chú phải là một chuỗi',
    }),
});

const checkoutReorderSchema = Joi.object({
    order_id: Joi.number().required().messages({
        'any.required': 'ID đơn hàng là bắt buộc',
    }),
    address_id: Joi.number().required().messages({
        'any.required': 'ID địa chỉ là bắt buộc',
    }),
    payment_method: Joi.string()
        .valid(...Object.values(paymentMethods))
        .optional()
        .messages({
            'any.only': 'Phương thức thanh toán không hợp lệ',
        }),
    note: Joi.string().allow('').optional().messages({
        'string.base': 'Ghi chú phải là một chuỗi',
    }),
});

const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        req.body = value;

        next();
    };
};

module.exports = {
    validateCheckoutBuyNow: validate(checkoutBuyNowSchema),
    validateCheckoutCart: validate(checkoutCartSchema),
    validateCheckoutReorder: validate(checkoutReorderSchema),
};
