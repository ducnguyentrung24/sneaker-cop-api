const orderService = require('./order.service');

const checkout = async (req, res) => {
    try {
        const { address_id, payment_method, note } = req.body;
        if (!address_id) {
            res.status(400).json({
                success: false,
                message: 'Address ID is required',
            });
        }

        const order = await orderService.checkout( 
            req.user.id,
            address_id,
            payment_method,
            note
        );

        res.status(201).json({
            success: true,
            message: 'Checkout successful',
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
    checkout,
    getMyOrders,
    getOrderDetail,
    cancelOrder,
};