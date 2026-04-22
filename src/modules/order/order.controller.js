const orderService = require('./order.service');

const checkoutFromCart = async (req, res) => {
    try {
        const order = await orderService.checkoutFromCart(req.user.id, req.body);

        res.status(200).json({
            success: true,
            message: 'Checkout from cart successful',
            data: order,
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const checkoutFromBuyNow = async (req, res) => {
    try {
        const order = await orderService.checkoutFromBuyNow(req.user.id, req.body);

        res.status(200).json({
            success: true,
            message: 'Checkout buy now successful',
            data: order,
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const data = await orderService.getMyOrders(req.user.id, req.query);

        res.status(200).json({
            success: true,
            message: 'Get orders successful',
            data,
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getOrderDetail = async (req, res) => {
    try {
        const data = await orderService.getOrderDetail(req.user.id, req.params.id);

        res.status(200).json({
            success: true,
            message: 'Get order detail successful',
            data,
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const data = await orderService.cancelOrder(req.user.id, req.params.id);

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data,
        })
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    checkoutFromCart,
    checkoutFromBuyNow,
    getMyOrders,
    getOrderDetail,
    cancelOrder,
};