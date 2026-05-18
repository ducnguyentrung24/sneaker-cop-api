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

module.exports = {
    getDashboardSummary,
};