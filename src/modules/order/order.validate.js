const Joi = require('joi');
const { paymentMethods } = require('../../constants/paymentMethod.constant');

const checkoutSchema = Joi.object({
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

const validateCheckout = (req, res, next) => {
    const { error, value } = checkoutSchema.validate(req.body, {
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
    validateCheckout,
};
