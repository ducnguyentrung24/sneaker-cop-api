const express = require('express');
const router = express.Router();

const cartController = require('./cart.controller');
const { authenticate } = require("../../middleware/auth.middleware");

router.get("/", authenticate, cartController.getCart);

router.post("/", authenticate, cartController.addToCart);

module.exports = router;