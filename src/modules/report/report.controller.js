const reportService = require("./report.service");

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

module.exports = {
    getRevenueSummary,
    getRevenueByProduct,
};