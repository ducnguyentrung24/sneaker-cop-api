const reviewService = require('./review.service');

const getReviewsByProduct = async (req, res) => {
    try {
        const data = await reviewService.getReviewsByProduct(req.params.id, req.query);

        res.status(200).json({
            success: true,
            message: 'Get reviews successfully',
            data,
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const createReview = async (req, res) => {
    try {
        const review = await reviewService.createReview(req.user.id, req.body);

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            data: review,
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getReviewsByProduct,
    createReview,
};