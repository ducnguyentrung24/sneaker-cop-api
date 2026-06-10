const { Op } = require('sequelize');

const Order = require('../order/order.model');
const OrderItem = require('../order/orderItem.model');
const Product = require('../product/product.model');
const ProductVariant = require('../product/productVariant.model');
const Category = require('../category/category.model');

const { orderStatus } = require('../../constants/orderStatus.constant');

const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getCurrentWeekRange = () => {
    const now = new Date();

    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;

    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - diffToMonday);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(fromDate);
    toDate.setDate(fromDate.getDate() + 6);
    toDate.setHours(23, 59, 59, 999);

    return { fromDate, toDate };
};

const getStatisticDateRange = (query = {}) => {
    const {
        period = 'month',
        year,
        month,
    } = query;

    const allowedPeriods = ['week', 'month', 'year'];
    if (!allowedPeriods.includes(period)) throw new Error("Kỳ hạn không hợp lệ.");

    const now = new Date();
    
    const selectedYear = year ? Number(year) : now.getFullYear();
    if (!selectedYear || selectedYear < 2000) throw new Error("Năm không hợp lệ.");

    if (period === 'week') {
        const { fromDate, toDate } = getCurrentWeekRange();
        return {
            period,
            fromDate,
            toDate,
        };
    }

    if (period === 'month') {
        const selectedMonth = month ? Number(month) : now.getMonth() + 1;
        if (!selectedMonth || selectedMonth < 1 || selectedMonth > 12) throw new Error("Tháng không hợp lệ.");

        const fromDate = new Date(selectedYear, selectedMonth - 1, 1);
        fromDate.setHours(0, 0, 0, 0);

        const toDate = new Date(selectedYear, selectedMonth, 0);
        toDate.setHours(23, 59, 59, 999);

        return {
            period,
            fromDate,
            toDate,
        };
    }

    if (period === 'year') {
        const fromDate = new Date(selectedYear, 0, 1);
        fromDate.setHours(0, 0, 0, 0);

        const toDate = new Date(selectedYear, 11, 31);
        toDate.setHours(23, 59, 59, 999);

        return {
            period,
            fromDate,
            toDate,
        };
    }
};

const getPreviousDateRange = ({ period, fromDate, toDate }) => {
    let previousFromDate, previousToDate;

    if (period === 'week') {
        previousFromDate = new Date(fromDate);
        previousFromDate.setDate(fromDate.getDate() - 7);
        previousFromDate.setHours(0, 0, 0, 0);

        previousToDate = new Date(toDate);
        previousToDate.setDate(toDate.getDate() - 7);
        previousToDate.setHours(23, 59, 59, 999);
    }

    if (period === 'month') {
        previousFromDate = new Date(
            fromDate.getFullYear(),
            fromDate.getMonth() - 1,
            1
        );
        previousFromDate.setHours(0, 0, 0, 0);

        previousToDate = new Date(
            fromDate.getFullYear(),
            fromDate.getMonth(),
            0
        );
        previousToDate.setHours(23, 59, 59, 999);
    }

    if (period === 'year') {
        previousFromDate = new Date(
            fromDate.getFullYear() - 1,
            0,
            1
        );
        previousFromDate.setHours(0, 0, 0, 0);

        previousToDate = new Date(
            fromDate.getFullYear() - 1,
            11,
            31
        );
        previousToDate.setHours(23, 59, 59, 999);
    }

    return { previousFromDate, previousToDate };
};

const calculateGrowthRate = (currentValue, previousValue) => {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;

    return Number(
        (((currentValue - previousValue) / Math.abs(previousValue)) * 100).toFixed(1)
    );
};

const getTrend = (value) => {
    if (value > 0) return 'increase';
    if (value < 0) return 'decrease';
    return 'no_change';
};

const getSummaryByRange = async (fromDate, toDate) => {
    const totalOrders = await Order.count({
        where: {
            created_at: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate,
            },
        },
    });

    const totalRevenue = await Order.sum('final_price', {
        where: {
            status: orderStatus.COMPLETED,
            updated_at: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate,
            },
        },
    });

    const completedOrders = await Order.count({
        where: {
            status: orderStatus.COMPLETED,
            updated_at: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate,
            },
        },
    });

    const cancelledOrders = await Order.count({
        where: {
            status: orderStatus.CANCELLED,
            updated_at: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate,
            },
        },
    });

    return {
        total_revenue: Number(totalRevenue || 0),
        total_orders: totalOrders,
        completed_orders: completedOrders,
        cancelled_orders: cancelledOrders,

        average_order_value: completedOrders
            ? Math.round(Number(totalRevenue || 0) / completedOrders)
            : 0,

        cancel_rate: totalOrders
            ? Number(((cancelledOrders / totalOrders) *100).toFixed(1))
            : 0,
    };
};

// Statistic service
const getStatisticSummary = async (query = {}) => {
    const {
        period,
        fromDate,
        toDate,
    } = getStatisticDateRange(query);

    const {
        previousFromDate,
        previousToDate,
    } = getPreviousDateRange({ period, fromDate, toDate });

    const currentStats = await getSummaryByRange(fromDate, toDate);

    const previousStats = await getSummaryByRange(previousFromDate, previousToDate);

    const pendingOrders = await Order.count({
        where: {
            status: orderStatus.PENDING,
        },
    });

    const lowStockCount = await ProductVariant.count({
        where: {
            stock: {
                [Op.lte]: 10,
            },
        },
    });

    const revenueGrowthRate = calculateGrowthRate(currentStats.total_revenue, previousStats.total_revenue);
    const orderGrowthRate = calculateGrowthRate(currentStats.total_orders, previousStats.total_orders);

    return {
        period,

        current_period: {
            from_date: formatDate(fromDate),
            to_date: formatDate(toDate),
        },

        previous_period: {
            from_date: formatDate(previousFromDate),
            to_date: formatDate(previousToDate),
        },

        summary: {
            total_revenue: currentStats.total_revenue,
            total_orders: currentStats.total_orders,
            completed_orders: currentStats.completed_orders,
            pending_orders: pendingOrders,
            cancelled_orders: currentStats.cancelled_orders,
            cancel_rate: currentStats.cancel_rate,
            low_stock_count: lowStockCount,
            average_order_value: currentStats.average_order_value,
        },

        comparison: {
            previous_revenue: previousStats.total_revenue,
            previous_orders: previousStats.total_orders,

            revenue_difference: currentStats.total_revenue - previousStats.total_revenue,
            order_difference: currentStats.total_orders - previousStats.total_orders,

            revenue_growth_rate: revenueGrowthRate,
            order_growth_rate: orderGrowthRate,

            revenue_trend: getTrend(revenueGrowthRate),
            order_trend: getTrend(orderGrowthRate),
        },
    };
};

const getRevenueChart = async (query = {}) => {
    const {
        period,
        fromDate,
        toDate,
    } = getStatisticDateRange(query);

    const orders = await Order.findAll({
        where: {
            status: orderStatus.COMPLETED,
            updated_at: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate,
            },
        },
        atributes: ['id', 'final_price', 'updated_at'],
        order: [['updated_at', 'ASC']],
    });

    const result = {};

    if (period === 'week') {
        const labels = {
            0: 'CN',
            1: 'T2',
            2: 'T3',
            3: 'T4',
            4: 'T5',
            5: 'T6',
            6: 'T7',
        };

        for (let i = 0; i < 7; i++) {
            const date = new Date(fromDate);
            date.setDate(fromDate.getDate() + i);

            const label = labels[date.getDay()];

            result[label] = {
                label,
                revenue: 0,
                orders: 0,
            };
        }
    }

    if (period === 'month') {
        const totalDays = toDate.getDate();

        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(
                fromDate.getFullYear(),
                fromDate.getMonth(),
                day
            );

            const label = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

            result[label] = {
                label,
                revenue: 0,
                orders: 0,
            };
        }
    }

    if (period === 'year') {
        for (let month = 0; month < 12; month++) {
            const label = `Tháng ${month + 1}`;

            result[label] = {
                label,
                revenue: 0,
                orders: 0,
            };
        }
    }

    orders.forEach(order => {
        const date = new Date(order.updated_at);

        let label;

        if (period === 'week') {
            const labels = {
                0: 'CN',
                1: 'T2',
                2: 'T3',
                3: 'T4',
                4: 'T5',
                5: 'T6',
                6: 'T7',
            };

            label = labels[date.getDay()];
        }

        if (period === 'month') {
            label = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        if (period === 'year') {
            label = `Tháng ${date.getMonth() + 1}`;
        }

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

    return {
        period,

        current_period: {
            from_date: formatDate(fromDate),
            to_date: formatDate(toDate),
        },

        group_by: period === 'year' ? 'month' : 'day',

        data: Object.values(result),
    }
};

const getTopProducts = async (query = {}) => {
    const { limit = 10 } = query;

    const limitNumber = Number(limit) || 10;

    const {
        period,
        fromDate,
        toDate,
    } = getStatisticDateRange(query);

    const orders = await Order.findAll({
        where: {
            status: orderStatus.COMPLETED,
            updated_at: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate,
            },
        },
        attributes: ['id'],
        include: [
            {
                model: OrderItem,
                as: 'items',
                attributes: ['id', 'product_variant_id', 'quantity', 'price'],
                include: [
                    {
                        model: ProductVariant,
                        as: 'variant',
                        attributes: ['id', 'product_id'],
                        include: [
                            {
                                model: Product,
                                as: 'product',
                                attributes: ['id', 'name', 'thumbnail'],
                            },
                        ],
                    },
                ],
            },
        ],
    });

    const result = {};

    orders.forEach(order => {
        order.items.forEach(item => {
            const product = item.variant?.product;
            if (!product) return;

            const productId = product.id;
            const quantity = Number(item.quantity || 0);
            const revenue = Number(item.price || 0) * quantity;

            if (!result[productId]) {
                result[productId] = {
                    product_id: product.id,
                    product_name: product.name,
                    thumbnail: product.thumbnail,
                    sold_quantity: 0,
                    revenue: 0,
                };
            }

            result[productId].sold_quantity += quantity;
            result[productId].revenue += revenue;
        });
    });

    const data = Object.values(result)
        .sort((a, b) => b.sold_quantity - a.sold_quantity)
        .slice(0, limitNumber);

    return {
        period,

        current_period: {
            from_date: formatDate(fromDate),
            to_date: formatDate(toDate),
        },

        total_products: data.length,

        data,
    };
};

const getRevenueByCategory = async (query = {}) => {
    const {
        period,
        fromDate,
        toDate,
    } = getStatisticDateRange(query);

    const orders = await Order.findAll({
        where: {
            status: orderStatus.COMPLETED,
            updated_at: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate,
            },
        },
        attributes: ['id'],
        include: [
            {
                model: OrderItem,
                as: 'items',
                attributes: ['id', 'product_variant_id', 'quantity', 'price'],
                include: [
                    {
                        model: ProductVariant,
                        as: 'variant',
                        attributes: ['id', 'product_id'],
                        include: [
                            {
                                model: Product,
                                as: 'product',
                                attributes: ['id', 'category_id'],
                                include: [
                                    {
                                        model: Category,
                                        as: 'category',
                                        attributes: ['id', 'name'],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    });

    const result = {};
    let totalRevenue = 0;

    orders.forEach(order => {
        order.items.forEach(item => {
            const category = item.variant?.product?.category;
            if (!category) return;

            const categoryId = category.id;
            const quantity = Number(item.quantity || 0);
            const revenue = Number(item.price || 0) * quantity;

            if (!result[categoryId]) {
                result[categoryId] = {
                    category_id: category.id,
                    category_name: category.name,
                    sold_quantity: 0,
                    revenue: 0,
                    percent: 0,
                };
            }

            result[categoryId].sold_quantity += quantity;
            result[categoryId].revenue += revenue;

            totalRevenue += revenue;
        });
    });

    const data = Object.values(result)
        .map(item => ({
            ...item,
            percent: totalRevenue 
                ? Number(((item.revenue / totalRevenue) * 100).toFixed(1)) 
                : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);

    return {
        period,

        current_period: {
            from_date: formatDate(fromDate),
            to_date: formatDate(toDate),
        },

        total_revenue: totalRevenue,
        total_categories: data.length,

        data,
    };
};

const getLowStockProducts = async (query = {}) => {
    const {
        limit = 20,
        threshold = 10,
    } = query;

    const limitNumber = Number(limit) || 20;
    const thresholdNumber = Number(threshold) || 10;

    const variants = await ProductVariant.findAll({
        where: {
            stock: {
                [Op.lte]: thresholdNumber,
            },
        },
        attributes: ['id', 'product_id', 'color', 'size', 'price', 'stock', 'image_url'],
        include: [
            {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'thumbnail'],
            },
        ],
        order: [['stock', 'ASC']],
        limit: limitNumber,
    });

    const data = variants.map(variant => ({
        variant_id: variant.id,
        product_id: variant.product_id || variant.product?.id,
        product_name: variant.product?.name || null,
        thumbnail: variant.image_url || variant.product?.thumbnail,
        color: variant.color,
        size: variant.size,
        price: Number(variant.price || 0),
        stock: Number(variant.stock || 0),
    }));

    return {
        threshold: thresholdNumber,
        total: data.length,
        data,
    };
};

const getRecentOrders = async (query = {}) => {
    const { limit = 10 } = query;

    const limitNumber = Number(limit) || 10;

    const orders = await Order.findAll({
        attributes: ['id', 'order_code', 'receiver_name', 'phone', 'final_price', 'status', 'payment_method', 'payment_status', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: limitNumber,
    });

    const data = orders.map(order => ({
        order_id: order.id,
        order_code: order.order_code,
        receiver_name: order.receiver_name,
        phone: order.phone,
        final_price: Number(order.final_price || 0),
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        created_at: order.created_at,
    }));

    return {
        total: data.length,
        data,
    };
};

module.exports = {
    getStatisticSummary,
    getRevenueChart,
    getTopProducts,
    getRevenueByCategory,
    getLowStockProducts,
    getRecentOrders,
};