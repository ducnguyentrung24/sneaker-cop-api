const { Op } = require("sequelize");
const { sequelize } = require("../../models");

const Product = require("./product.model");
const ProductImage = require("./productImage.model");
const ProductVariant = require("./productVariant.model");

const getProducts = async (query) => {
    const {
        page = 1,
        limit = 10,
        search = "",
        brand_id,
        category_id
    } = query;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Where conditions
    const where = {};

    if (search?.trim()) {
        where.name = {
            [Op.iLike]: `%${search.trim()}%`
        };
    }

    if (brand_id) where.brand_id = brand_id;
    if (category_id) where.category_id = category_id;

    const { rows, count } = await Product.findAndCountAll({
        where,
        limit: limitNum,
        offset,
        order: [['created_at', 'DESC']],
        attributes: [
            "id",
            "name",
            "base_price",
            "discount_percent",
            "thumbnail",
            "sold",
        ]
    });

    const totalPages = Math.ceil(count / limitNum);

    return {
        data: rows,
        pagination: {
            total: count,
            page: pageNum,
            limit: limitNum,
            total_pages: totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        }
    };
};

const getProductById = async (productId) => {
    const product = await Product.findByPk(productId, {
        include: [
            { association: 'images' },
            { association: 'variants'}
        ]
    });
    if (!product) {
        throw new Error("Product not found");
    }

    return product;
};

const createProduct = async (data) => {
    return await sequelize.transaction(async (transaction) => {
        const { images, variants, ...productData } = data;

        // Check images
        if (images && images.length > 4) {
            throw new Error("Maximum 4 images allowed");
        }

        // Check for duplicate name
        if (productData.name) {
            const existingProduct = await Product.findOne({
                where: {
                    name: productData.name,
                }
            });

            if (existingProduct) {
                throw new Error("Product name already exists");
            }
        }

        // 1. create product
        const product = await Product.create(productData, { transaction });

        // 2. create images
        if (images?.length) {
            const imageData = images.map(url => ({
                product_id: product.id,
                image_url: url,
            }));

            await ProductImage.bulkCreate(imageData, { transaction });
        }

        // 3. create variants
        if (variants) {
            if (!Array.isArray(variants)) {
                throw new Error("Variants must be an array");
            }

            if (variants.length) {
                // Check for duplicate variants
                const seen = new Set();

                for (const variant of variants) {
                    const key = `${variant.color}-${variant.size}`;

                    if (seen.has(key)) {
                        throw new Error(`Duplicate variant: ${key}`);
                    }

                    seen.add(key);
                }

                const variantData = variants.map(variant => ({
                    product_id: product.id,
                    color: variant.color,
                    size: variant.size,
                    stock: variant.stock,
                    price: variant.price,
                    image_url: variant.image_url,
                }));

                await ProductVariant.bulkCreate(variantData, { transaction });
            }
        }

        return product;
    });
};

const updateProduct = async (productId, data) => {
    return await sequelize.transaction(async (transaction) => {
        const product = await Product.findByPk(productId, { transaction });
        if (!product) {
            throw new Error("Product not found");
        }

        const { images, variants, ...productData } = data;

        // Check images
        if (images && images.length > 4) {
            throw new Error("Maximum 4 images allowed");
        }

        // Check for duplicate name
        if (productData.name) {
            const existingProduct = await Product.findOne({
                where: {
                    name: productData.name,
                    id: { [Op.ne]: productId }
                }
            });

            if (existingProduct) {
                throw new Error("Product name already exists");
            }
        }

        // 1. update product
        await product.update(productData, { transaction });

        // 2. update images
        if (images) {
            // Delete old images
            await ProductImage.destroy({
                where: { product_id: productId },
                transaction,
            });

            const imageData = images.map(url => ({
                product_id: productId,
                image_url: url,
            }));

            await ProductImage.bulkCreate(imageData, { transaction });
        }

        // 3. update variants
        if (variants) {
            if (!Array.isArray(variants)) {
                throw new Error("Variants must be an array");
            }

            // Check for duplicate variants
            const seen = new Set();

            for (const variant of variants) {
                const key = `${variant.color}-${variant.size}`;

                if (seen.has(key)) {
                    throw new Error(`Duplicate variant: ${key}`);
                }

                seen.add(key);
            }

            // Delete old variants
            await ProductVariant.destroy({
                where: { product_id: productId },
                transaction,
            });

            const variantData = variants.map(variant => ({
                product_id: productId,
                color: variant.color,
                size: variant.size,
                stock: variant.stock,
                price: variant.price,
                image_url: variant.image_url,
            }));

            await ProductVariant.bulkCreate(variantData, { transaction });
        }

        return product;
    });
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
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};