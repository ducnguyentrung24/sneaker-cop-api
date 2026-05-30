const { Op } = require('sequelize');

const User = require('../user/user.model');
const Product = require('../product/product.model');
const ProductVariant = require('../product/productVariant.model');
const Order = require('../order/order.model');
const OrderItem = require('../order/orderItem.model');
const Category = require('../category/category.model');
const Brand = require('../brand/brand.model');

const { orderStatus } = require('../../constants/orderStatus.constant');

const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${day}/${month}/${year}`;
};

const getTodayDate = () => {
    const now = new Date();

    const fromDate = new Date(now);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(now);
    toDate.setHours(23, 59, 59, 999);
    
    return {
        fromDate,
        toDate,
    };
};

const getCurrentWeekRange = () => {
    const now = new Date();

    // Sunday = 0, Monday = 1
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;

    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - diffToMonday);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(fromDate);
    toDate.setDate(fromDate.getDate() + 6);
    toDate.setHours(23, 59, 59, 999);

    return {
        fromDate,
        toDate,
    };
};

const getDashboardDateRange = (period = 'today') => {
    if (period === 'today') return getTodayDate();
    if (period === 'week') return getCurrentWeekRange();
    throw new Error('Invalid period');
};

const getDashboardMetrics = async (fromDate, toDate) => {
    const totalOrders = await Order.count({
        where: {
            created_at: {
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

    const revenue = await Order.sum('final_price', {
        where: {
            status: orderStatus.COMPLETED,
            updated_at: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate,
            },
        },
    });

    const newCustomers = await User.count({
        where: {
            created_at: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate,
            },
        },
    });

    return {
        total_revenue: Number(revenue || 0),
        total_orders: totalOrders,
        completed_orders: completedOrders,
        cancelled_orders: cancelledOrders,
        new_customers: newCustomers,
    };
};

const getDashboardSummary = async (query) => {
    const { period = 'today' } = query;
    const { fromDate, toDate } = getDashboardDateRange(period);

    const stats = await getDashboardMetrics(fromDate, toDate);

    const totalUsers = await User.count();
    const totalProducts = await Product.count();
    const totalOrders = await Order.count();

    const pendingOrders = await Order.count({
        where: {
            status: orderStatus.PENDING,
        },
    });

    const cancelledOrders = await Order.count({
        where: {
            status: orderStatus.CANCELLED,
        },
    });

    const lowStockProducts = await ProductVariant.count({
        where: {
            stock: { [Op.lte]: 10 },
        },
    });

    return {
        period,

        current_period: {
            from_date: formatDate(fromDate),
            to_date: formatDate(toDate),
        },

        ...stats,

        overview: {
            total_users: totalUsers,
            total_products: totalProducts,
            pending_orders: pendingOrders,
            low_stock_count: lowStockProducts,

            cancel_rate: totalOrders
            ? Number(((cancelledOrders / totalOrders) * 100).toFixed(1))
            : 0,
        }
    };
};

const getRevenueStatistics = async () => {
    const { fromDate, toDate } = getCurrentWeekRange();

    const orders = await Order.findAll({
        where: {
            status: orderStatus.COMPLETED,
            updated_at: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate,
            },
        },
        attributes: ['id', 'final_price', 'updated_at'],
        order: [['updated_at', 'ASC']],
    });

    const result = {};

    const formatLabel = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');

        return `${day}/${month}`;
    };

    const formatDayName = (date) => {
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return days[date.getDay()];
    };

    for (let i = 0; i < 7; i++) {
        const date = new Date(fromDate);
        date.setDate(fromDate.getDate() + i);

        const label = formatLabel(date);

        result[label] = {
            day: formatDayName(date),
            date: label,
            revenue: 0,
            orders: 0,
        };
    }

    orders.forEach(order => {
        const date = new Date(order.updated_at);
        const label = formatLabel(date);

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
        period: 'week',

        current_period: {
            from_date: formatDate(fromDate),
            to_date: formatDate(toDate),
        },

        data: Object.values(result),
    };
};

const getTopProducts = async (query) => {
    const { 
        limit = 5,
        period = 'today',
     } = query;
    
    const { fromDate, toDate } = getDashboardDateRange(period);

    const limitNumber = Number(limit) || 5;

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
            if (!result[productId]) {
                result[productId] = {
                    product_id: product.id,
                    product_name: product.name,
                    thumbnail: product.thumbnail,
                    sold_quantity: 0,
                    revenue: 0,
                };   
            }

            result[productId].sold_quantity += Number(item.quantity);
            result[productId].revenue += Number(item.price) * Number(item.quantity);
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

        data,
    };
};

const getLowStockProducts = async (query) => {
    const { threshold = 10 } = query;

    const thresholdNumber = Number(threshold) || 10;

    const variants = await ProductVariant.findAll({
        where: {
            stock: { [Op.lte]: thresholdNumber },
        },
        attributes: ['id', 'product_id', 'color', 'size', 'stock', 'image_url'],
        include: [
            {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'thumbnail'],
            },
        ],
        order: [['stock', 'ASC']],
    });

    return variants.map(variant => ({
        variant_id: variant.id,
        product_id: variant.product_id,
        product_name: variant.product?.name,
        color: variant.color,
        size: variant.size,
        stock: variant.stock,
        image: variant.image_url || variant.product?.thumbnail,
    }));
};

const getPaymentStatistics = async (query) => {
    const { period = 'today' } = query;
    const { fromDate, toDate } = getDashboardDateRange(period);

    const orders = await Order.findAll({
        where: {
            status: orderStatus.COMPLETED,
            updated_at: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate,
            },
        },

        attributes: ['id', 'payment_method', 'payment_status']
    });

    const statistics = {
        COD: {
            total: 0,
            PAID: 0,
            UNPAID: 0,
            FAILED: 0,
        },
        VNPAY: {
            total: 0,
            PAID: 0,
            UNPAID: 0,
            FAILED: 0,
        },

        total_by_status: {
            PAID: 0,
            UNPAID: 0,
            FAILED: 0,
        },

        total_orders: 0,
    };

    orders.forEach(order => {
        const method = order.payment_method;
        const status = order.payment_status;

        if (statistics[method] && statistics[method][status] !== undefined) {
            statistics[method][status] += 1;
            statistics[method].total += 1;
            statistics.total_by_status[status] += 1;
            statistics.total_orders += 1;
        }
    });

    return {
        period,
        current_period: {
            from_date: formatDate(fromDate),
            to_date: formatDate(toDate),
        },
        statistics,
    };
};

const getCategoryStatistics = async () => {
    const totalCategories = await Category.count();

    const products = await Product.findAll({
        attributes: ['id', 'category_id'],
        include: [
            {
                model: Category,
                as: 'category',
                attributes: ['id', 'name'],
            },
        ],
    });

    const totalProducts = products.length;

    const statistics = {};

    products.forEach(product => {
        const category = product.category;
        if (!category) return;
        
        const categoryId = category.id;

        if (!statistics[categoryId]) {
            statistics[categoryId] = {
                category_id: category.id,
                category_name: category.name,
                product_count: 0,
                percent: 0,
            };
        }
        statistics[categoryId].product_count += 1;
    });

    const categories = Object.values(statistics).map(item => ({
        ...item,
        percent: totalProducts
            ? Math.round((item.product_count / totalProducts) * 100)
            : 0,
    }));

    return {
        total_categories: totalCategories,
        total_products: totalProducts,
        categories,
    }
};

const getBrandStatistics = async () => {
    const totalBrands = await Brand.count();

    const products = await Product.findAll({
        attributes: ['id', 'brand_id'],
        include: [
            {
                model: Brand,
                as: 'brand',
                attributes: ['id', 'name'],
            },
        ],
    });

    const totalProducts = products.length;

    const statistics = {};

    products.forEach(product => {
        const brand = product.brand;
        if (!brand) return;

        const brandId = brand.id;
        
        if (!statistics[brandId]) {
            statistics[brandId] = {
                brand_id: brand.id,
                brand_name: brand.name,
                product_count: 0,
                percent: 0,
            };
        }
        statistics[brandId].product_count += 1;
    });

    const brands = Object.values(statistics).map(item => ({
        ...item,
        percent: totalProducts
            ? Math.round((item.product_count / totalProducts) * 100)
            : 0,
    }));

    return {
        total_brands: totalBrands,
        total_products: totalProducts,
        brands,
    };
};

module.exports = {
    getDashboardSummary,
    getRevenueStatistics,
    getTopProducts,
    getLowStockProducts,
    getPaymentStatistics,
    getCategoryStatistics,
    getBrandStatistics,
};