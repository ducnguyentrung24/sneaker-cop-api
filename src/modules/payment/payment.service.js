const crypto = require('crypto');
const qs = require('qs');
const moment = require('moment');

const { sequelize } = require('../../models');
const Order = require('../order/order.model');
const { paymentStatus } = require('../../constants/paymentMethod.constant');
const config = require('../../config/vnpay.config');
const { orderStatus } = require('../../constants/orderStatus.constant');

const createPaymentUrl = async (orderId) => {
    const order = await Order.findByPk(orderId);
    if (!order) {
        throw new Error('Order not found');
    }

    if (order.payment_status === paymentStatus.PAID) {
        throw new Error('Order already paid');
    }

    const date = moment().format('YYYYMMDDHHmmss');

    const params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: config.tmnCode,
        vnp_Amount: Math.round(parseFloat(order.final_price) * 100),
        vnp_CurrCode: 'VND',
        vnp_TxnRef:  `${order.order_code}_${Date.now()}`,
        vnp_OrderInfo: `Thanh toan don hang ${order.order_code}`,
        vnp_OrderType: 'other',
        vnp_Locale: 'vn',
        vnp_ReturnUrl: config.returnUrl,
        vnp_IpAddr: "127.0.0.1",
        vnp_CreateDate: date
    };

    // 1. Sort and encode parameters
    const sorted = Object.keys(params)
        .sort()
        .reduce((acc, key) => {
            acc[key] = encodeURIComponent(params[key]).replace(/%20/g, '+');
            return acc;
        }, {});

    // 2. Create signature
    const signData = qs.stringify(sorted, { encode: false });

    const hmac = crypto.createHmac('sha512', config.secretKey);
    const signature = hmac.update(signData, 'utf-8').digest('hex');

    sorted.vnp_SecureHash = signature;

    const paymentUrl = `${config.vnpUrl}?${qs.stringify(sorted, { encode: true })}`;

    return paymentUrl;
};

const handleVnpayReturn = async (query) => {
    return await sequelize.transaction(async (transaction) => {
        let vnp_Params = { ...query };

        const secureHash = vnp_Params["vnp_SecureHash"];

        delete vnp_Params["vnp_SecureHash"];
        delete vnp_Params["vnp_SecureHashType"];

        // Verify hash
        const sorted = Object.keys(vnp_Params)
            .sort()
            .reduce((acc, key) => {
                acc[key] = encodeURIComponent(vnp_Params[key]).replace(/%20/g, '+');
                return acc;
            }, {});

        const signData = qs.stringify(sorted, { encode: false });

        const hmac = crypto.createHmac('sha512', config.secretKey);
        const signed = hmac.update(signData).digest('hex');

        if (secureHash !== signed) {
            throw new Error('Invalid signature');
        }

        // Find order + lock
        const order = await Order.findOne({
            where: { order_code: vnp_Params['vnp_TxnRef'].split('_')[0].trim() },
            transaction,
            lock: true,
        });

        if (!order) {
            throw new Error('Order not found');
        }

        // idempotent (tránh xử lý lại)
        if (order.payment_status === paymentStatus.PAID) {
            return order;
        }

        if (vnp_Params['vnp_ResponseCode'] === '00') {
            await order.update({
                payment_status: paymentStatus.PAID,
                status: orderStatus.PROCESSING,
            }, { transaction });
        } else {
            await order.update({
                payment_status: paymentStatus.FAILED,
            }, { transaction });
        }

        return order;
    });
};

module.exports = {
    createPaymentUrl,
    handleVnpayReturn,
};