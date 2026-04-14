const Joi = require("joi");

const categorySchema = Joi.object({
    name: Joi.string().required().messages({
        "any.required": "Tên danh mục là bắt buộc",
    }),
});

const validate = (schema) => (res, req, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: true,
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
    validateCategory: validate(categorySchema),
};