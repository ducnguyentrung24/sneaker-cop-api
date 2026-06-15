const recommendationService = require('./recommendation.service');

const getRecommendations = async (req, res) => {
    try {
        const data = await recommendationService.getRecommendations(
            req.user?.id || null,
            req.query
        );

        res.status(200).json({
            success: true,
            message: 'Get recommendations successfully',
            data,
        });
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getRecommendations,
};