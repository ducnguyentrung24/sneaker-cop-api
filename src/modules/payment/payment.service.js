const config = require('../../config/vnpay.config');

const crypto = require('crypto');
const qs = require('qs');
const moment = require('moment');

const { sequelize } = require('../../models');
const Order = require('../order/order.model');
const OrderItem = require('../order/orderItem.model');
const Cart = require('../cart/cart.model');
const CartItem = require('../cart/cartItem.model');
const ProductVariant = require('../product/productVariant.model');
const OrderStatusLog = require('../order/orderStatusLog.model');

const { paymentStatus } = require('../../constants/paymentMethod.constant');
const { orderStatus } = require('../../constants/orderStatus.constant');

const sortAndEncode = (params) => {
   let sorted = {};
   let keys = Object.keys(params).sort();

    keys.forEach(key => {
        sorted[key] = encodeURIComponent(params[key]).replace(/%20/g, '+');
    });

    return sorted;
};

const createSignature = (params) => {
    const signData = qs.stringify(params, { encode: false });
    const hmac = crypto.createHmac('sha512', config.secretKey);
    return hmac.update(signData, 'utf-8').digest('hex');
};

const createPaymentUrl = async (orderId) => {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');
    if (order.payment_status === paymentStatus.PAID) throw new Error('Đơn hàng đã được thanh toán');

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
        vnp_CreateDate: date,
        vnp_BankCode: 'NCB',
    };

    const sorted = sortAndEncode(params);
    const signature = createSignature(sorted);

    sorted.vnp_SecureHash = signature;

    return `${config.vnpUrl}?${qs.stringify(sorted, { encode: false })}`;
};

const handleVnpayReturn = async (query) => {
    return await sequelize.transaction(async (transaction) => {
        let vnp_Params = { ...query };

        const secureHash = vnp_Params["vnp_SecureHash"];
        delete vnp_Params["vnp_SecureHash"];
        delete vnp_Params["vnp_SecureHashType"];

        const sorted = sortAndEncode(vnp_Params);
        const signed = createSignature(sorted);

        if (secureHash !== signed) throw new Error('Chữ ký không hợp lệ');

        const orderCode = vnp_Params['vnp_TxnRef'].split('_')[0].trim();
        const order = await Order.findOne({
            where: { order_code: orderCode },
            transaction,
            lock: true,
        });

        if (!order) throw new Error('Không tìm thấy đơn hàng');
        if (order.payment_status === paymentStatus.PAID || order.payment_status === paymentStatus.FAILED) return order;

        // Validate amount
        const vnpAmount = Number(vnp_Params['vnp_Amount']);
        const expectedAmount = Math.round(order.final_price * 100);
        if (vnpAmount !== expectedAmount) throw new Error('Số tiền không khớp');

        // Update order
        if (vnp_Params['vnp_ResponseCode'] === '00') {
            await order.update({
                payment_status: paymentStatus.PAID,
            }, { transaction });

            // Clear cart
            const cart = await Cart.findOne({ 
                where: { user_id: order.user_id }, 
                transaction,
            });

            if (cart) {
                const orderItems = await OrderItem.findAll({
                    where: { order_id: order.id },
                    transaction,
                });

                const variantIds = orderItems.map(item => item.product_variant_id);

                if (variantIds.length > 0) {
                    await CartItem.destroy({
                        where: {
                            cart_id: cart.id,
                            product_variant_id: variantIds,
                        },
                        transaction,
                    });
                }
            }
        } else {
            const oldStatus = order.status;

            await order.update({
                payment_status: paymentStatus.FAILED,
                status: orderStatus.CANCELLED,
            }, { transaction });

            const orderItems = await OrderItem.findAll({
                where: { order_id: order.id },
                transaction,
            });

            for (const item of orderItems) {
                const variant = await ProductVariant.findByPk(
                    item.product_variant_id, 
                    { 
                        transaction,
                        lock: transaction.LOCK.UPDATE,
                    }
                );

                if (variant) {
                    await variant.update({
                        stock: Number(variant.stock || 0) + Number(item.quantity || 0),
                    }, { transaction });
                }
            }

            await OrderStatusLog.create({
                order_id: order.id,
                from_status: oldStatus,
                to_status: orderStatus.CANCELLED,
                changed_by: order.user_id,
                note: 'Thanh toán VNPAY thất bại',
            }, { transaction });
        }

        return order;
    });
};

module.exports = {
    createPaymentUrl,
    handleVnpayReturn,
};