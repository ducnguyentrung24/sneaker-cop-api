const cartService = require('./cart.service');

const getCart = async (req, res) => {
    try {
        const data = await cartService.getCart(req.user.id);

        res.status(200).json({
            success: true,
            data,
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const addToCart = async (req, res) => {
    try {
        const cartItem = await cartService.addToCart(
            req.user.id, 
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Item added to cart successfully",
            data: cartItem,
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getCart,
    addToCart,
};