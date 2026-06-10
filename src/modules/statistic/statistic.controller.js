const statisticService = require('./statistic.service');

const getStatisticSummary = async (req, res) => {
    try {
        const data = await statisticService.getStatisticSummary(req.query);

        res.status(200).json({
            success: true,
            message: "Get statistic summary successfully",
            data,
        });
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getRevenueChart = async (req, res) => {
    try {
        const data = await statisticService.getRevenueChart(req.query);

        res.status(200).json({
            success: true,
            message: "Get revenue chart successfully",
            data,
        });
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getTopProducts = async (req, res) => {
    try {
        const data = await statisticService.getTopProducts(req.query);

        res.status(200).json({
            success: true,
            message: "Get top products successfully",
            data,
        });
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getRevenueByCategory = async (req, res) => {
    try {
        const data = await statisticService.getRevenueByCategory(req.query);

        res.status(200).json({
            success: true,
            message: "Get revenue by category successfully",
            data,
        });
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getLowStockProducts = async (req, res) => {
    try {
        const data = await statisticService.getLowStockProducts(req.query);

        res.status(200).json({
            success: true,
            message: "Get low stock products successfully",
            data,
        });
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getRecentOrders = async (req, res) => {
    try {
        const data = await statisticService.getRecentOrders(req.query);

        res.status(200).json({
            success: true,
            message: "Get recent orders successfully",
            data,
        });
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getStatisticSummary,
    getRevenueChart,
    getTopProducts,
    getRevenueByCategory,
    getLowStockProducts,
    getRecentOrders,
};