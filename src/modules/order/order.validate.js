const Joi = require('joi');
const { paymentMethods } = require('../../constants/paymentMethod.constant');

const checkoutBuyNowSchema = Joi.object({
    variant_id: Joi.number().required().messages({
        'any.required': 'Variant ID is required',
    }),
    quantity: Joi.number().integer().min(1).required().messages({
        'any.required': 'Quantity is required',
        'number.base': 'Quantity must be a number',
        'number.integer': 'Quantity must be an integer',
        'number.min': 'Quantity must be at least 1',
    }),
    address_id: Joi.number().required().messages({
        'any.required': 'Address ID is required',
    }),
    payment_method: Joi.string()
        .valid(...Object.values(paymentMethods))
        .optional()
        .messages({
            'any.only': 'Invalid payment method',
        }),
    note: Joi.string().allow('').optional().messages({
        'string.base': 'Note must be a string',
    }),
});

const checkoutCartSchema = Joi.object({
    address_id: Joi.number().required().messages({
        'any.required': 'Address ID is required',
    }),
    selected_item_ids: Joi.array()
        .items(Joi.number().required())
        .min(1)
        .required()
        .messages({
            'any.required': 'Selected item IDs are required',
            'array.base': 'Selected item IDs must be an array',
            'array.min': 'At least one item must be selected',
        }),
    payment_method: Joi.string()
        .valid(...Object.values(paymentMethods))
        .optional()
        .messages({
            'any.only': 'Invalid payment method',
        }),
    note: Joi.string().allow('').optional().messages({
        'string.base': 'Note must be a string',
    }),
});

const checkoutReorderSchema = Joi.object({
    order_id: Joi.number().required().messages({
        'any.required': 'Order ID is required',
    }),
    address_id: Joi.number().required().messages({
        'any.required': 'Address ID is required',
    }),
    payment_method: Joi.string()
        .valid(...Object.values(paymentMethods))
        .optional()
        .messages({
            'any.only': 'Invalid payment method',
        }),
    note: Joi.string().allow('').optional().messages({
        'string.base': 'Note must be a string',
    }),
});

const validateCheckoutBuyNow = (req, res, next) => {
    const { error, value } = checkoutBuyNowSchema.validate(req.body, {
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

const validateCheckoutCart = (req, res, next) => {
    const { error, value } = checkoutCartSchema.validate(req.body, {
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

const validateCheckoutReorder = (req, res, next) => {
    const { error, value } = checkoutReorderSchema.validate(req.body, {
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

module.exports = {
    validateCheckoutBuyNow,
    validateCheckoutCart,
    validateCheckoutReorder,
};
