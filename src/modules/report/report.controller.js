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
        console.log('===== EXPORT EXCEL START =====');
        console.log('Query:', req.query);

        const summary = await reportService.getRevenueSummary(req.query);
        console.log('Summary OK');

        const products = await reportService.getRevenueByProduct({
            ...req.query,
            limit: 10,
        });
        console.log('Products OK:', products.data.length);

        const brands = await reportService.getRevenueByBrand(req.query);
        console.log('Brands OK:', brands.data.length);

        const categories = await reportService.getRevenueByCategory(req.query);
        console.log('Categories OK:', categories.data.length);

        const orders = await reportService.getRevenueOrders(req.query);
        console.log('Orders OK:', orders.data.length);

        await buildRevenueExcel({
            summary,
            products,
            brands,
            categories,
            orders,
            res,
        });

        console.log('===== EXPORT EXCEL DONE =====');

    } catch (error) {
        console.error('===== EXPORT EXCEL FAILED =====');
        console.error(error);

        return res.status(500).json({
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