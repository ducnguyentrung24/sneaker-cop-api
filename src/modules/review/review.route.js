const express = require('express');
const router = express.Router();

const reviewController = require('./review.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validateCreateReview } = require('./review.validate');

router.get('/product/:id', authenticate, reviewController.getReviewsByProduct);

router.post('/',
    authenticate,
    validateCreateReview,
    reviewController.createReview
);

module.exports = router;