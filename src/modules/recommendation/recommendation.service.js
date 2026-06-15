const { Op } = require('sequelize');

const Behavior = require('../behavior/behavior.model');
const Product = require('../product/product.model');

const getBestSellerProducts = async (limit, excludeIds = []) => {
    const where = {};

    if (excludeIds.length > 0) {
        where.id = { [Op.notIn]: excludeIds };
    }

    const products = await Product.findAll({
        where,
        attributes: ['id', 'name', 'base_price', 'discount_percent', 'final_price', 'thumbnail', 'sold'],
        order: [['sold', 'DESC']],
        limit,
    });

    return products.map(product => ({
        id: product.id,
        name: product.name,
        base_price: product.base_price,
        discount_percent: product.discount_percent,
        final_price: product.final_price,
        thumbnail: product.thumbnail,
        sold: product.sold,
        score: 0,
    }));
};

const getRecommendations = async (userId, query = {}) => {
    const { limit = 10 } = query;
    const limitNumber = Number(limit) || 10;

    if (!userId) return await getBestSellerProducts(limitNumber);

    const behaviors = await Behavior.findAll({
        where: { user_id: userId },
        include: [
            {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'base_price', 'discount_percent', 'final_price', 'thumbnail', 'sold'],
            },
        ],
        order: [['score', 'DESC']],
        limit: limitNumber,
    });

    const recommendedProducts = [];
    const recommendedIds = new Set();

    for (const item of behaviors) {
        if (!item.product) continue;
        if (recommendedIds.has(item.product.id)) continue;

        recommendedIds.add(item.product.id);

        recommendedProducts.push({
            id: item.product.id,
            name: item.product.name,
            base_price: item.product.base_price,
            discount_percent: item.product.discount_percent,
            final_price: item.product.final_price,
            thumbnail: item.product.thumbnail,
            sold: item.product.sold,
            score: Number(item.score || 0),
        });
    }

    recommendedProducts.sort((a, b) => b.score - a.score);

    if (recommendedProducts.length >= limitNumber) return recommendedProducts;

    const remainingLimit = limitNumber - recommendedProducts.length;

    const fallbackProducts = await getBestSellerProducts(
        remainingLimit,
        Array.from(recommendedIds)
    );

    return [
        ...recommendedProducts,
        ...fallbackProducts,
    ];
};

module.exports = {
    getRecommendations,
};