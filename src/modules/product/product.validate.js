const Joi = require("joi");
const { col } = require("sequelize");

const productSchema = Joi.object({
    name: Joi.string().required().messages({
        "any,required": "Tên sản phẩm là bắt buộc",
    }),
    brand_id: Joi.required().messages({
        "any,required": "Thương hiệu là bắt buộc",
    }),
    category_id: Joi.required().messages({
        "any,required": "Danh mục là bắt buộc",
    }),
    base_price: Joi.number().min(0).required().messages({
        "number.base": "Giá phải là một số",
        "number.min": "Giá phải lớn hơn hoặc bằng 0",
        "any,required": "Giá là bắt buộc",
    }),
    discount_percent: Joi.number().min(0).max(100).messages({
        "number.base": "Phần trăm giảm giá phải là một số",
        "number.min": "Phần trăm giảm giá phải lớn hơn hoặc bằng 0",
        "number.max": "Phần trăm giảm giá phải nhỏ hơn hoặc bằng 100",
    }),
    description: Joi.string().allow("").optional().messages({
        "string.base": "Mô tả phải là một chuỗi",
    }),
    thumbnail: Joi.string().required().messages({
        "any,required": "Ảnh đại diện là bắt buộc",
    }),

    images: Joi.array().items(Joi.string()),

    variants: Joi.array().items(
        Joi.object({
            color: Joi.string().required().messages({
                "any.required": "Màu sắc là bắt buộc",
            }),
            size: Joi.string().required().messages({
                "any.required": "Kích thước là bắt buộc",
            }),
            stock: Joi.number().integer().min(0).required().messages({
                "any.required": "Số lượng là bắt buộc",
                "number.base": "Số lượng phải là một số",
                "number.integer": "Số lượng phải là một số nguyên",
                "number.min": "Số lượng phải lớn hơn hoặc bằng 0",
            }),
            price: Joi.number().min(0).required().messages({
                "any.required": "Giá là bắt buộc",
                "number.base": "Giá phải là một số",
                "number.min": "Giá phải lớn hơn hoặc bằng 0",
            }),
            image_url: Joi.string().optional(),
        })
    ),
});

const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({
            error: error.details[0].message,
        });
    }

    req.body = value;

    next();
};

module.exports = {
    validateProduct: validate(productSchema),
};