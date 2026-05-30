const reportService = require("./report.service");

const { buildRevenueExcel } = require('./report.excel');

const getRevenueSummary = async (req, res) => {
    try {
        const data = await reportService.getRevenueSummary(req.query);

        res.status(200).json({
            success: true,
            message: 'Get revenue summary successfully',
            data,
        });
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getRevenueByProduct = async (req, res) => {
    try {
        const data = await reportService.getRevenueByProduct(req.query);

        res.status(200).json({
            success: true,
            message: 'Get revenue by product successfully',
            data,
        });
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getRevenueByBrand = async (req, res) => {
    try {
        const data = await reportService.getRevenueByBrand(req.query);

        res.status(200).json({
            success: true,
            message: 'Get revenue by brand successfully',
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
        const data = await reportService.getRevenueByCategory(req.query);

        res.status(200).json({
            success: true,
            message: 'Get revenue by category successfully',
            data,
        });
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });        
    }
};

const getRevenueOrders = async (req, res) => {
    try {
        const data = await reportService.getRevenueOrders(req.query);

        res.status(200).json({
            success: true,
            message: 'Get revenue orders successfully',
            data,
        });
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });        
    }
};

const exportRevenueExcel = async (req, res) => {
    try {
        const summary = await reportService.getRevenueSummary(req.query);

        const products = await reportService.getRevenueByProduct({
            ...req.query,
            limit: 10,
        });

        const brands = await reportService.getRevenueByBrand(req.query);

        const categories = await reportService.getRevenueByCategory(req.query);

        const orders = await reportService.getRevenueOrders(req.query);

        await buildRevenueExcel({
            summary,
            products,
            brands,
            categories,
            orders,
            res,
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getRevenueSummary,
    getRevenueByProduct,
    getRevenueByBrand,
    getRevenueByCategory,
    getRevenueOrders,
    exportRevenueExcel,
};