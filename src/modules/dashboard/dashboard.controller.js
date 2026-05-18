const dashboardService = require('./dashboard.service');

const getDashboardSummary = async (req, res) => {
    try {
        const data = await dashboardService.getDashboardSummary();

        res.status(200).json({
            success: true,
            message: 'Get dashboard summary successfully',
            data,
        });
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getRevenueStatistics = async (req, res) => {
    try {
        const data = await dashboardService.getRevenueStatistics(req.query.type);

        res.status(200).json({
            success: true,
            message: 'Get revenue statistics successfully',
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
    getDashboardSummary,
    getRevenueStatistics,
};