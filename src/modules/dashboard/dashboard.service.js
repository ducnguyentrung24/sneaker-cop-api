const { Op } = require('sequelize');

const User = require('../user/user.model');
const Product = require('../product/product.model');
const ProductVariant = require('../product/productVariant.model');
const Order = require('../order/order.model');
const OrderItem = require('../order/orderItem.model');
const Category = require('../category/category.model');
const Brand = require('../brand/brand.model');

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

const getRevenueStatistics = async (type = 'week') => {
    const allowedTypes = ['week', 'month', 'year'];
    if (!allowedTypes.includes(type)) throw new Error('Invalid satatistics type');

    const now = new Date();
    const startDate = new Date();

    if (type === 'week') startDate.setDate(now.getDate() - 6);
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

    const formatLabel = (date, type) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        if (type === 'week') return `${day}/${month}`;
        if (type === 'month') return `${month}/${year}`;
        if (type === 'year') return `${year}`;

        return `${day}/${month}/${year}`;
    };

    if (type === 'week') {
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const label = formatLabel(date, type);
            result[label] = {
                label,
                revenue: 0,
                orders: 0,
            };
        }
    }

    if (type === 'month') {
        for (let i = 0; i < 12; i++) {
            const date = new Date(startDate);
            date.setMonth(startDate.getMonth() + i);

            const label = formatLabel(date, type);
            result[label] = {
                label,
                revenue: 0,
                orders: 0,
            };
        }
    }

    if (type === 'year') {
        for (let i = 0; i < 5; i++) {
            const date = new Date(startDate);
            date.setFullYear(startDate.getFullYear() + i);

            const label = formatLabel(date, type);
            result[label] = {
                label,
                revenue: 0,
                orders: 0,
            };
        }
    }

    orders.forEach(order => {
        const date = new Date(order.created_at);
        const label = formatLabel(date, type);

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

const getTopProducts = async (query) => {
    const { limit = 5 } = query;

    const limitNumber = Number(limit) || 5;

    const products = await Product.findAll({
        attributes: ['id', 'name', 'thumbnail', 'sold'],
        where: {
            sold: { [Op.gt]: 0 },
        },
        order: [ ['sold', 'DESC'] ],
        limit: limitNumber,
    });

    return products.map(product => ({
        product_id: product.id,
        product_name: product.name,
        thumbnail: product.thumbnail,
        sold_quantity: product.sold || 0,
    }));
};

const getLowStockProducts = async (query) => {
    const { threshold = 5 } = query;

    const thresholdNumber = Number(threshold) || 5;

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

const getPaymentStatistics = async () => {
    const orders = await Order.findAll({
        attributes: [
            'id',
            'payment_method',
            'payment_status',
        ]
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

    return statistics;
};

const getCategoryStatistics = async () => {
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
        categories: categories.length,
        total_products: totalProducts,
        categories,
    }
};

const getBrandStatistics = async () => {
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
        total_brands: brands.length,
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