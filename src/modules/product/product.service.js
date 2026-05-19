const { Op } = require("sequelize");
const { sequelize } = require("../../models");

const Product = require("./product.model");
const ProductImage = require("./productImage.model");
const ProductVariant = require("./productVariant.model");
const Review = require("../review/review.model");

const paresArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(Number);
    if (typeof value === "string") return value.split(",").map(Number);
    return [];
};

const calculateFinalPrice = (base_price, discount_percent = 0) => {
    return Number(base_price) * (1 - Number(discount_percent) / 100);
};

const applyFilter = (filter, where) => {
    switch (filter) {
        case "best_seller":
            where.sold = { [Op.gte]: 100 };
            break;
        case "discount":
            where.discount_percent = { 
                ...(where.discount_percent || {}),
                [Op.gt]: 0 
            };
            break;
        default:
            break;
    }
};

const applySort = (sort) => {
    switch (sort) {
        case "newest":
            return [['created_at', 'DESC']];
        case "price_asc":
            return [['final_price', 'ASC']];
        case "price_desc":
            return [['final_price', 'DESC']];
        case "sold_desc":
            return [['sold', 'DESC']];
        default:
            return [['created_at', 'DESC']];
    }
};

const getProducts = async (query) => {
    const {
        page = 1,
        limit = 10,
        search = "",
        brand_id,
        category_id,
        min_discount_percent,
        sort,
        filter,
        min_price = null,
        max_price = null,
    } = query;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    
    // Search
    if (search?.trim()) where.name = { [Op.iLike]: `%${search.trim()}%` };

    // Filter + Sort
    const rawCategory = category_id || query['category_id[]'];
    const rawBrand = brand_id || query['brand_id[]'];

    const categoryIds = paresArray(rawCategory);
    const brandIds = paresArray(rawBrand);

    if (categoryIds.length) where.category_id = { [Op.in]: categoryIds };
    if (brandIds.length) where.brand_id = { [Op.in]: brandIds };
    
    if (min_discount_percent) {
        where.discount_percent = { 
            [Op.gte]: Number(min_discount_percent) 
        };
    
    }

    if (min_price !== null || max_price !== null) {
        where.final_price = {};

        if (min_price === null && max_price !== null) where.final_price[Op.lt] = Number(max_price);
        else if (min_price !== null && max_price === null) where.final_price[Op.gt] = Number(min_price);
        else if (min_price !== null && max_price !== null) {
            where.final_price[Op.gte] = Number(min_price);
            where.final_price[Op.lte] = Number(max_price);
        }
    }

    if (filter) applyFilter(filter, where);

    const order = applySort(sort);

    const { rows, count } = await Product.findAndCountAll({
        where,
        limit: limitNum,
        offset,
        order,
        attributes: [
            "id",
            "thumbnail",
            "name",
            "base_price",
            "discount_percent",
            "final_price",
            "sold",
        ],
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
    if (!product) throw new Error("Product not found");

    return product;
};

// Admin
const createProduct = async (data) => {
    return await sequelize.transaction(async (transaction) => {
        const { images, variants, ...productData } = data;

        // Check images
        if (images && images.length > 4) throw new Error("Maximum 4 images allowed");

        // Check for duplicate name
        if (productData.name) {
            const existingProduct = await Product.findOne({
                where: {
                    name: productData.name,
                }
            });

            if (existingProduct) throw new Error("Product name already exists");
        }

        // Calculate final price
        productData.final_price = calculateFinalPrice(productData.base_price, productData.discount_percent);

        // Create product
        const product = await Product.create(productData, { transaction });

        // Create images
        if (images?.length) {
            const imageData = images.map(url => ({
                product_id: product.id,
                image_url: url,
            }));

            await ProductImage.bulkCreate(imageData, { transaction });
        }

        // Create variants
        if (variants) {
            if (!Array.isArray(variants)) throw new Error("Variants must be an array");

            if (variants.length) {
                // Check for duplicate variants
                const seen = new Set();

                for (const variant of variants) {
                    const key = `${variant.color}-${variant.size}`;
                    if (seen.has(key)) throw new Error(`Duplicate variant: ${key}`);

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
        if (!product) throw new Error("Product not found");

        const { images, variants, ...productData } = data;

        // Check images
        if (images && images.length > 4) throw new Error("Maximum 4 images allowed");

        // Check for duplicate name
        if (productData.name) {
            const existingProduct = await Product.findOne({
                where: {
                    name: productData.name,
                    id: { [Op.ne]: productId }
                }
            });

            if (existingProduct) throw new Error("Product name already exists");
        }

        // Calculate final price update
        if (productData.base_price != null || productData.discount_percent != null) {
            const base_price = productData.base_price ?? product.base_price;
            const discount_percent = productData.discount_percent ?? product.discount_percent;

            productData.final_price = calculateFinalPrice(base_price, discount_percent);
        }

        // Update product
        await product.update(productData, { transaction });

        // Update images
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

        // Update variants
        if (variants) {
            if (!Array.isArray(variants)) throw new Error("Variants must be an array");

            // Check for duplicate variants
            const seen = new Set();

            for (const variant of variants) {
                const key = `${variant.color}-${variant.size}`;
                if (seen.has(key)) throw new Error(`Duplicate variant: ${key}`);

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
    if (!product) throw new Error("Product not found");

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