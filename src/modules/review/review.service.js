const { sequelize } = require('../../models');
const Review = require('./review.model');
const Order = require('../order/order.model');
const OrderItem = require('../order/orderItem.model');
const ProductVariant = require('../product/productVariant.model');

const { orderStatus } = require('../../constants/orderStatus.constant');

const getReviewsByProduct = async (productId, query = {}) => {
    const {
        page = 1,
        limit = 5,
        rating,
        sort = 'created_at:desc'
    } = query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const where = { product_id: productId };

    if (rating) where.rating = rating;

    // sort
    let order = [['created_at', 'DESC']];

    if (sort) {
        const [field, direction] = sort.split(':');
        order = [[field, direction.toUpperCase()]];
    }

    const { count, rows } = await Review.findAndCountAll({
        where,
        limit: limitNumber,
        offset,
        order,
    });

    // stast + avg
    const stats = await Review.findAll({
        where: { product_id: productId },
        attributes: [
            'rating',
            [sequelize.fn('COUNT', sequelize.col('rating')), 'count'],
            [sequelize.fn('AVG', sequelize.col('rating')), 'avg_rating'],
        ],
        group: ['rating'],
        raw: true,
    });

    // format distribution + avg
    const rating_distribution = {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
    };

    let total = 0;
    let sum = 0;

    stats.forEach(stat => {
        const r = Number(stat.rating);
        const c = Number(stat.count);

        rating_distribution[r] = c;
        total += c;
        sum += r * c;
    });

    const average_rating = total ? (sum / total) : 0;

    const totalPages = Math.ceil(count / limitNumber);

    return {
        average_rating,
        total_reviews: total,
        rating_distribution,
        reviews: rows,
        pagination: {
            total: count,
            page: pageNumber,
            limit: limitNumber,
            total_pages: totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1
        },
    };

};

const createReview = async (userId, data) => {
    return await sequelize.transaction(async (transaction) => {
        const { product_id, order_id, rating, comment } = data;

        // Check order
        const order = await Order.findOne({
            where: { id: order_id, user_id: userId },
            transaction,
        });

        if (!order) throw new Error('Order not found');
        if (order.status !== orderStatus.COMPLETED) throw new Error('Only completed orders can be reviewed');

        // Check product in order
        const item = await OrderItem.findOne({
            where: { order_id },
            include: {
                model: ProductVariant,
                as: 'variant',
                where: { product_id },
                attributes: ['id', 'product_id'],
            },
            transaction,
        });

        if (!item) throw new Error('Product not found in this order');

        // Check duplicate review
        const existingReview = await Review.findOne({
            where: { user_id: userId, product_id, order_id },
            transaction,
        });

        if (existingReview) throw new Error('You have already reviewed this product in this product');

        // Create review
        const review = await Review.create({
            user_id: userId,
            product_id,
            order_id,
            rating,
            comment,
        }, { transaction });

        return review;
    });
};

module.exports = {
    getReviewsByProduct,
    createReview,
};