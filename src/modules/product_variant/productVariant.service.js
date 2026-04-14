const ProductVariant = require("./productVariant.model");

const getVariantsByProduct = async (productId) => {
    return await ProductVariant.findAll({
        where: { product_id: productId },
    });
};

const createVariant = async (productId, data) => {
    const existingVariant = await ProductVariant.findOne({
        where: {
            product_id: productId,
            color: data.color,
            size: data.size,
        },
    });

    if (existingVariant) {
        throw new Error("Variant with the same color and size already exists for this product");
    }

    return await ProductVariant.create({
        ...data,
        product_id: productId
    });
};

const updateVariant = async (variantId, data) => {
    const variant = await ProductVariant.findByPk(variantId);
    if (!variant) {
        throw new Error("Variant not found");
    }

    if (data.color || data.size) {
        const existingVariant = await ProductVariant.findOne({
            where: {
                product_id: variant.product_id,
                color: data.color ?? variant.color,
                size: data.size ?? variant.size,
            }
        });

        if (existingVariant && existingVariant.id !== variantId) {
            throw new Error("Variant with the same color and size already exists for this product");
        }
    }

    delete data.stock;

    await variant.update(data);

    return variant;
};

const updateStock = async (variantId, stock) => {
    const variant = await ProductVariant.findByPk(variantId);
    if (!variant) {
        throw new Error("Variant not found");
    }

    variant.stock = stock;
    
    await variant.save();

    return variant;
};

const deleteVariant = async (variantId) => {
    const variant = await ProductVariant.findByPk(variantId);
    if (!variant) {
        throw new Error("Variant not found");
    }

    await variant.destroy();

    return { message: "Variant deleted successfully" };
};

module.exports = {
    getVariantsByProduct,
    createVariant,
    updateVariant,
    updateStock,
    deleteVariant,
};