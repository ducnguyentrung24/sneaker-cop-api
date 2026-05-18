const { Op } = require('sequelize');

const User = require('../user/user.model');
const Product = require('../product/product.model');
const ProductVariant = require('../product/productVariant.model');
const Order = require('../order/order.model');

const { orderStatus } = require('../../constants/orderStatus.constant');

const getDashboardSummary = async () => {
    const totalUsers = await User.count();
    const totalProducts = await Product.count();
    const totalOrders = await Order.count();

    const pendingOrders = await Order.count({
        where: {
            status: orderStatus.PENDING,
        },
    });

    const lowStockCount = await ProductVariant.count({
        where: {
            stock: { [Op.lte]: 10 },
        },
    });

    const totalRevenue = await Order.sum('final_price', {
        where: {
            status: orderStatus.COMPLETED,
        },
    });

    return {
        total_users: totalUsers,
        total_products: totalProducts,
        total_orders: totalOrders,
        pending_orders: pendingOrders,
        low_stock_count: lowStockCount,
        total_revenue: Number(totalRevenue || 0),
    };
};

const getRevenueStatistics = async (type = 'day') => {
    const allowedTypes = ['day', 'month', 'year'];
    if (!allowedTypes.includes(type)) throw new Error('Invalid satatistics type');

    const now = new Date();
    const startDate = new Date();

    if (type === 'day') startDate.setDate(now.getDate() - 6);
    if (type === 'month') {
        startDate.setMonth(now.getMonth() - 11);
        startDate.setDate(1);
    }
    if (type === 'year') {
        startDate.setFullYear(now.getFullYear() - 4);
        startDate.setMonth(0);
        startDate.setDate(1);
    }

    startDate.setHours(0, 0, 0, 0);

    const orders = await Order.findAll({
        where: {
            status: orderStatus.COMPLETED,
            created_at: {
                [Op.gte]: startDate,
            },
        },
        attributes: ['id', 'final_price', 'created_at'],
        order: [['created_at', 'ASC']],
    });

    const result = {};

    orders.forEach(order => {
        const date = new Date(order.created_at);
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        let label = `${year}-${month}-${day}`;

        if (type === 'month') label = `${year}-${month}`;
        if (type === 'year') label = `${year}`;

        if (!result[label]) {
            result[label] = {
                label,
                revenue: 0,
                orders: 0,
            };
        }

        result[label].revenue += Number(order.final_price || 0);
        result[label].orders += 1;
    });

    return Object.values(result);
};

module.exports = {
    getDashboardSummary,
    getRevenueStatistics,
};