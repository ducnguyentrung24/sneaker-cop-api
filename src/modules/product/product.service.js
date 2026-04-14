const sequelize = require('../../config/database');

const Product = require('./product.model');
const ProductImage = require('./productImage.model');
const ProductVariant = require('../product_variant/productVariant.model');

const createProudct = async(data) => {
    const transaction = await sequelize.transaction();

    try {
        const { images, variants, ...productData } = data;

        // 1 Product
        const product = await Product.create(
            productData,
            { transaction }
        );

        // 2 Images
        if (images?.length) {
            const imageData = images.map(url => ({
                product_id: product.id,
                image_url: url,
            }));

            await ProductImage.bulkCreate(
                imageData,
                { transaction }
            );
        }

        // 3 Variants
        if (variants?.length) {
            const variantData = variants.map(v => ({
                product_id: product.id,
                color: v.color,
                size: v.size,
                stock: v.stock,
                price: v.price,
                image_url: v.image_url,
            }));

            await ProductVariant.bulkCreate(
                variantData,
                { transaction }
            );
        }

        await transaction.commit();

        return product;

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

module.exports = {
    createProudct,
};