const Joi = require('joi');

const reviewSchema = Joi.object({
    product_id: Joi.number().integer().required().messages({
        "any.required": "ID sản phẩm là bắt buộc",
        "number.base": "ID sản phẩm phải là một số",
    }),
    order_id: Joi.number().integer().required().messages({
        "any.required": "ID đơn hàng là bắt buộc",
        "number.base": "ID đơn hàng phải là một số",
    }),
    rating: Joi.number().integer().min(1).max(5).required().messages({
        "any.required": "Đánh giá là bắt buộc",
        "number.base": "Đánh giá phải là một số",
        "number.min": "Đánh giá tối thiểu là 1",
        "number.max": "Đánh giá tối đa 5",
    }),
    comment: Joi.string().trim().allow("", null).max(1000).messages({
        "string.base": "Bình luận phải là một chuỗi",
        "string.max": "Bình luận không được vượt quá 1000 ký tự",
    }),
});

const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, 
        { 
            abortEarly: false, 
            allowUnknown: true,
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
    validateCreateReview: validate(reviewSchema),
};