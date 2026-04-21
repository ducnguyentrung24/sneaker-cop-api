const crypto = require('crypto');
const qs = require('qs');
const moment = require('moment');

const { sequelize } = require('../../models');
const Order = require('../order/order.model');

const { paymentStatus } = require('../../constants/paymentMethod.constant');
const { orderStatus } = require('../../constants/orderStatus.constant');
const config = require('../../config/vnpay.config');

const sortAndEncode = (params) => {
    return Object.keys(params)
        .sort()
        .reduce((acc, key) => {
            acc[key] = encodeURIComponent(params[key]).replace(/%20/g, '+');
            return acc;
        }, {});
};

const createSignature = (params) => {
    const signData = qs.stringify(params, { encode: false });
    const hmac = crypto.createHmac('sha512', config.secretKey);
    return hmac.update(signData, 'utf-8').digest('hex');
};

const createPaymentUrl = async (orderId) => {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error('Order not found');

    if (order.payment_status === paymentStatus.PAID) throw new Error('Order already paid');

    const date = moment().format('YYYYMMDDHHmmss');

    const txnRef = `${order.order_code}_${Date.now()}`;

    const params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: config.tmnCode,
        vnp_Amount: Math.round(parseFloat(order.final_price) * 100),
        vnp_CurrCode: 'VND',
        vnp_TxnRef:  txnRef,
        vnp_OrderInfo: `Thanh toan don hang ${order.order_code}`,
        vnp_OrderType: 'other',
        vnp_Locale: 'vn',
        vnp_ReturnUrl: config.returnUrl,
        vnp_IpAddr: "127.0.0.1",
        vnp_CreateDate: date
    };

    const sorted = sortAndEncode(params);
    const signature = createSignature(sorted);

    sorted.vnp_SecureHash = signature;

    return `${config.vnpUrl}?${qs.stringify(sorted, { encode: true })}`;
};

const handleVnpayReturn = async (query) => {
    return await sequelize.transaction(async (transaction) => {
        let vnp_Params = { ...query };

        const secureHash = vnp_Params["vnp_SecureHash"];

        delete vnp_Params["vnp_SecureHash"];
        delete vnp_Params["vnp_SecureHashType"];

        const sorted = sortAndEncode(vnp_Params);
        const signed = createSignature(sorted);

        if (secureHash !== signed) throw new Error('Invalid signature');

        const orderCode = vnp_Params['vnp_TxnRef'].split('_')[0].trim();
        const order = await Order.findOne({
            where: { order_code: orderCode },
            transaction,
            lock: true,
        });

        if (!order) throw new Error('Order not found');

        // idempotent check
        if (order.payment_status === paymentStatus.PAID) return order;

        // Validate amount
        const vnpAmount = Number(vnp_Params['vnp_Amount']);
        const expectedAmount = Math.round(order.final_price * 100);

        if (vnpAmount !== expectedAmount) throw new Error('Amount mismatch');

        // Update order
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