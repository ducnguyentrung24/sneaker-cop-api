const paymentService = require('./payment.service');
const Order = require('../order/order.model');

const createPayment = async (req, res) => {
    try {
        const url = await paymentService.createPaymentUrl(req.params.orderId);
        
        res.json({
            success: true,
            payment_url: url
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message
        })
    }
};

const vnpayReturn = async (req, res) => {
    try {
        const result = await paymentService.handleVnpayReturn(req.query);

        res.redirect(`${process.env.CLIENT_URL}/payment-result`);
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createPayment,
    vnpayReturn,
};