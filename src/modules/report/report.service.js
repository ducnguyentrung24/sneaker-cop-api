const { Op } = require("sequelize");

const Order = require("../order/order.model");
const OrderItem = require("../order/orderItem.model");
const Product = require("../product/product.model");
const ProductVariant = require("../product/productVariant.model");
const Brand = require("../brand/brand.model");
const Category = require("../category/category.model");

const { orderStatus } = require("../../constants/orderStatus.constant");

const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const getReportDateRange = (query) => {
    const {
        period = 'month',
        year,
        month,
        quarter,
    } = query;

    const allowedPeriods = ['month', 'quarter', 'year'];

    if (!allowedPeriods.includes(period)) throw new Error("Invalid report period");

    const now = new Date();

    const selectedYear = year ? Number(year) : now.getFullYear();

    if (!selectedYear || selectedYear < 2000) throw new Error("Invalid year");

    let fromDate, toDate;

    if (period === 'month') {
        const selectedMonth = month ? Number(month) : (now.getMonth() + 1);

        if (selectedMonth < 1 || selectedMonth > 12) throw new Error("Invalid month");

        fromDate = new Date(selectedYear, selectedMonth - 1, 1);
        fromDate.setHours(0, 0, 0, 0);

        toDate = new Date(selectedYear, selectedMonth, 0);
        toDate.setHours(23, 59, 59, 999);
    }

    if (period === 'quarter') {
        const selectedQuarter = quarter ? Number(quarter) : (Math.floor(now.getMonth() / 3) + 1);

        if (selectedQuarter < 1 || selectedQuarter > 4) throw new Error("Invalid quarter");

        const startMonth = (selectedQuarter - 1) * 3;

        fromDate = new Date(selectedYear, startMonth, 1);
        fromDate.setHours(0, 0, 0, 0);

        toDate = new Date(selectedYear, startMonth + 3, 0);
        toDate.setHours(23, 59, 59, 999);
    }

    if (period === 'year') {
        fromDate = new Date(selectedYear, 0, 1);
        fromDate.setHours(0, 0, 0, 0);

        toDate = new Date(selectedYear, 11, 31);
        toDate.setHours(23, 59, 59, 999);
    }

    return {
        period,
        fromDate,
        toDate,
        from_date: formatDate(fromDate),
        to_date: formatDate(toDate),
    };
};

const getPreviousReportDateRange = ({ period, fromDate }) => {
    let previousFromDate, previousToDate;

    if (period === 'month') {
        previousFromDate = new Date(
            fromDate.getFullYear(),
            fromDate.getMonth() - 1,
        );
        previousFromDate.setHours(0, 0, 0, 0);

        previousToDate = new Date(
            fromDate.getFullYear(),
            fromDate.getMonth(),
            0,
        );

        previousToDate.setHours(23, 59, 59, 999);
    }

    if (period === 'quarter') {
        previousFromDate = new Date(fromDate);
        previousFromDate.setMonth(previousFromDate.getMonth() - 3);
        previousFromDate.setHours(0, 0, 0, 0);

        previousToDate = new Date(fromDate);
        previousToDate.setDate(previousToDate.getDate() - 1);
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

    return {
        previousFromDate,
        previousToDate,
        previous_from_date: formatDate(previousFromDate),
        previous_to_date: formatDate(previousToDate),
    };
};

const getRevenueStatsByRange = async (fromDate, toDate) => {
    const totalRevenue = await Order.sum("final_price", {
        where: {
            status: orderStatus.COMPLETED,
            updated_at: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate,
            }
        }
    });

    const totalOrders = await Order.count({
        where: {
            status: orderStatus.COMPLETED,
            updated_at: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate,
            }
        }
    });

    return {
        total_revenue: Number(totalRevenue || 0),
        total_orders: totalOrders,
        average_order_value: totalOrders
            ? Math.round(Number(totalRevenue || 0) / totalOrders)
            : 0,
    }
};

const calculateGrowthRate = (currentValue, previousValue) => {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return Number(((currentValue - previousValue) / previousValue * 100).toFixed(2));
};

const getTrend = (value) => {
    if (value > 0) return "increase";
    if (value < 0) return "decrease";
    return "stable";
};


const getRevenueSummary = async (query) => {
    const {
        period,
        fromDate,
        toDate,
        from_date,
        to_date,
    } = getReportDateRange(query);

    const {
        previousFromDate,
        previousToDate,
        previous_from_date,
        previous_to_date,
    } = getPreviousReportDateRange({
        period,
        fromDate,
        toDate,
    });

    const currentStats = await getRevenueStatsByRange(fromDate, toDate);
    const previousStats = await getRevenueStatsByRange(previousFromDate, previousToDate);

    const revenueDifference = currentStats.total_revenue - previousStats.total_revenue;
    const ordersDifference = currentStats.total_orders - previousStats.total_orders;
    
    const revenueGrowthRate = calculateGrowthRate(currentStats.total_revenue, previousStats.total_revenue);
    const orderGrowthRate = calculateGrowthRate(currentStats.total_orders, previousStats.total_orders);

    return {
        period,

        current_period: {
            from_date,
            to_date,
        },

        previous_period: {
            from_date: previous_from_date,
            to_date: previous_to_date,
        },

        summary: {
            total_revenue: currentStats.total_revenue,
            total_orders: currentStats.total_orders,
            average_order_value: currentStats.average_order_value,
        },

        camparison: {
            previous_revenue: previousStats.total_revenue,
            previous_orders: previousStats.total_orders,

            revenue_difference: revenueDifference,
            orders_difference: ordersDifference,

            revenue_growth_rate: revenueGrowthRate,
            order_growth_rate: orderGrowthRate,

            revenue_trend: getTrend(revenueGrowthRate),
            order_trend: getTrend(orderGrowthRate),
        },
    };
};

const getRevenueByProduct = async (query) => {
    const { limit = 10 } = query;
    const limitNumber = Number(limit) || 10;

    const {
        period,
        fromDate,
        toDate,
        from_date,
        to_date,
    } = getReportDateRange(query);

    const orders = await Order.findAll({
        where: {
            status: orderStatus.COMPLETED,
            updated_at: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate,
            },
        },
        attributes: ["id"],
        include: [
            {
                model: OrderItem,
                as: "items",
                attributes: ['id', 'product_variant_id', 'quantity', 'price'],
                include: [
                    {
                        model: ProductVariant,
                        as: "variant",
                        attributes: ['id', 'product_id'],
                        include: [
                            {
                                model: Product,
                                as: "product",
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
            const product = item.variant?.product
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
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limitNumber);

    return {
        period,

        current_period: {
            from_date,
            to_date,
        },

        data,
    };
};

const getRevenueByBrand = async (query) => {
    const {
        period,
        fromDate,
        toDate,
        from_date,
        to_date,
    } = getReportDateRange(query);

    const orders = await Order.findAll({
        where: {
            status: orderStatus.COMPLETED,
            updated_at: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate,
            },
        },
        attributes: ["id"],
        include: [
            {
                model: OrderItem,
                as: "items",
                attributes: ['id', 'product_variant_id', 'quantity', 'price'],
                include: [
                    {
                        model: ProductVariant,
                        as: "variant",
                        attributes: ['id', 'product_id'],
                        include: [
                            {
                                model: Product,
                                as: "product",
                                attributes: ['id', 'name', 'thumbnail', 'brand_id'],
                                include: [
                                    {
                                        model: Brand,
                                        as: "brand",
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
            const brand = item.variant?.product?.brand
            if (!brand) return;

            const brandId = brand.id;
            const quantity = Number(item.quantity || 0);
            const revenue = Number(item.price || 0) * quantity;

            if (!result[brandId]) {
                result[brandId] = {
                    brand_id: brand.id,
                    brand_name: brand.name,
                    sold_quantity: 0,
                    revenue: 0,
                    percent: 0,
                };
            }

            result[brandId].sold_quantity += quantity;
            result[brandId].revenue += revenue;

            totalRevenue += revenue;
        });
    });

    const data = Object.values(result)
        .map(item => ({
            ...item,
            percent: totalRevenue
                ? Math.round((item.revenue / totalRevenue) * 100)
                : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);

    return {
        period,

        current_period: {
            from_date,
            to_date,
        },

        total_revenue: totalRevenue,

        data,
    };
};

const getRevenueByCategory = async (query) => {
    const {
        period,
        fromDate,
        toDate,
        from_date,
        to_date,
    } = getReportDateRange(query);

    const orders = await Order.findAll({
        where: {
            status: orderStatus.COMPLETED,
            updated_at: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate,
            },
        },
        attributes: ["id"],
        include: [
            {
                model: OrderItem,
                as: "items",
                attributes: ['id', 'product_variant_id', 'quantity', 'price'],
                include: [
                    {
                        model: ProductVariant,
                        as: "variant",
                        attributes: ['id', 'product_id'],
                        include: [
                            {
                                model: Product,
                                as: "product",
                                attributes: ['id', 'name', 'thumbnail', 'brand_id'],
                                include: [
                                    {
                                        model: Category,
                                        as: "category",
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
            const category = item.variant?.product?.category
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
                ? Math.round((item.revenue / totalRevenue) * 100)
                : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);

    return {
        period,

        current_period: {
            from_date,
            to_date,
        },

        total_revenue: totalRevenue,

        data,
    };
};

const getRevenueOrders = async (query) => {
    const {
        period,
        fromDate,
        toDate,
        from_date,
        to_date,
    } = getReportDateRange(query);

    const orders = await Order.findAll({
        where: {
            status: orderStatus.COMPLETED,
            updated_at: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate,
            },
        },
        attributes: ['id', 'order_code', 'receiver_name', 'phone', 'final_price', 'payment_method', 'payment_status', 'updated_at'],
        order: [['updated_at', 'DESC']],
    });

    const data = orders.map(order => ({
        id: order.id,
        order_code: order.order_code,
        receiver_name: order.receiver_name,
        phone: order.phone,
        final_price: Number(order.final_price || 0),
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        completed_at: order.updated_at,
    }));

    return {
        period,

        current_period: {
            from_date,
            to_date,
        },

        total_orders: orders.length,

        data,
    };
};

module.exports = {
    getRevenueSummary,
    getRevenueByProduct,
    getRevenueByBrand,
    getRevenueByCategory,
    getRevenueOrders,
};