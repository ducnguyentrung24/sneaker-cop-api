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

const checkoutFromReorder = async (req, res) => {
    try {
        const order = await orderService.checkoutFromReorder(req.user.id, req.body);

        res.status(200).json({
            success: true,
            message: "Checkout reorder successfull",
            data: order
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

// Admin
const getAllOrders = async (req, res) => {
    try {
        const result = await orderService.getAllOrders(req.query);

        res.status(200).json({
            success: true,
            message: 'Get all orders successful',
            data: result,
        });
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getAdminOrderDetail = async (req, res) => {
    try {
        const order = await orderService.getAdminOrderDetail(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Get admin order detail successfully',
            data: order
        })
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const order = await orderService.updateOrderStatus(
            req.params.id,
            req.user.id,
            req.body,
        );

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: {
                id: order.id,
                order_code: order.order_code,
                status: order.status,
            }
        });
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    checkoutFromCart,
    checkoutFromBuyNow,
    checkoutFromReorder,
    getMyOrders,
    getOrderDetail,
    cancelOrder,
    getAllOrders,
    getAdminOrderDetail,
    updateOrderStatus,
};