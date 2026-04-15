const express = require('express');
const router = express.Router();

const cartController = require('./cart.controller');
const { authenticate } = require("../../middleware/auth.middleware");

router.get("/", authenticate, cartController.getCart);

router.post("/", authenticate, cartController.addToCart);

router.put("/:id", authenticate, cartController.updateQuantity);

router.delete("/:id", authenticate, cartController.deleteCartItem);

module.exports = router;