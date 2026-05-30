const { Op } = require("sequelize");

const Order = require("../order/order.model");
const OrderItem = require("../order/orderItem.model");
const Product = require("../product/product.model");
const ProductVariant = require("../product/productVariant.model");

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

const getRevenueSummary = async (query) => {
    const {
        period,
        fromDate,
        toDate,
        from_date,
        to_date,
    } = getReportDateRange(query);

    const totalRevenue = await Order.sum("total_price", {
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
        period,

        current_period: {
            from_date,
            to_date,
        },

        summary: {
            total_revenue: Number(totalRevenue || 0),
            total_orders: totalOrders,
            average_order_value: totalOrders
                ? Math.round(Number(totalRevenue || 0) / totalOrders)
                : 0,
        },
    };
};

const getRevenueByProduct = async (query) => {
    const {
        limit = 10,
    } = query;

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
                    product_id: productId,
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

module.exports = {
    getRevenueSummary,
    getRevenueByProduct,
};