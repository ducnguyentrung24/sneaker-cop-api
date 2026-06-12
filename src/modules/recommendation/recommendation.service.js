const Behavior = require('../behavior/behavior.model');
const Product = require('../product/product.model');

const getRecommendations = async (userId, query) => {
    const { limit = 10 } = query;
    const limitNumber = Number(limit) || 10;

    const behaviors = await Behavior.findAll({
        where: { user_id: userId },
        include: [
            {
                model: Product,
                as: 'product',
                atributes: ['id', 'name', 'base_price', 'discount_percent', 'final_price', 'thumbnail'],
            }
        ],
        order: [['score', 'DESC']],
        limit: limitNumber,
    });

    return behaviors
            .filter(item => item.product)
            .map(item => ({
                id: item.product.id,
                name: item.product.name,
                base_price: item.product.base_price,
                discount_percent: item.product.discount_percent,
                final_price: item.product.final_price,
                thumbnail: item.product.thumbnail,
                score: item.score,
            }));
};

module.exports = {
    getRecommendations,
};