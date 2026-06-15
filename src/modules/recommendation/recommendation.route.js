const express = require('express');
const router = express.Router();

const recommendationController = require('./recommendation.controller');

const { optionalAuthenticate } = require("../../middleware/auth.middleware");

router.get("/", 
    optionalAuthenticate,
    recommendationController.getRecommendations
);

module.exports = router;