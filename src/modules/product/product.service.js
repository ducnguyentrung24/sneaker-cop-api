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
            const seen = new Set();

            for (const v of variants) {
                const key = `${v.color}-${v.size}`;

                if (seen.has(key)) {
                    throw new Error(`Duplicate variant with color ${v.color} and size ${v.size}`);
                }

                seen.add(key);
            }

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

const updateProduct = async (productId, data) => {
    const transaction = await sequelize.transaction();

    try {
        const { images, variants, ...productData } = data;

        const product = await Product.findByPk(productId);
        if (!product) {
            throw new Error("Product not found");
        }

        // 1. Update product
        await product.update(productData, { transaction });

        // 2. Replace images
        if (images) {
            await ProductImage.destroy({
                where: { product_id: productId },
                transaction,
            });

            const imageData = images.map(url => ({
                product_id: productId,
                image_url: url,
            }));

            await ProductImage.bulkCreate(
                imageData,
                { transaction }
            );
        }

        // 3. Replace variants
        if (variants) {
            const seen = new Set();

            for (const v of variants) {
                const key = `${v.color}-${v.size}`;

                if (seen.has(key)) {
                    throw new Error(`Duplicate variant with color ${v.color} and size ${v.size}`);
                }

                seen.add(key);
            }

            await ProductVariant.destroy({
                where: {
                    product_id: productId,
                    transaction,
                }
            });

            const variantData = variants.map(v => ({
                product_id: productId,
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
    } catch(error) {
        await transaction.rollback();
        throw error;
    }
};

const deleteProduct = async (productId) => {
    const product = await Product.findByPk(productId);
    if (!product) {
        throw new Error("Product not found");
    }

    await product.destroy();

    return { message: "Product deleted successfully" };
};

module.exports = {
    createProudct,
};