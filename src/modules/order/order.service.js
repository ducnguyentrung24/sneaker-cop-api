const { sequelize } = require('../../models');

const Order = require('./order.model');
const OrderItem = require('./orderItem.model');
const Cart = require('../cart/cart.model');
const CartItem = require('../cart/cartItem.model');
const Product = require('../product/product.model');
const ProductVariant = require('../product/productVariant.model');
const Address = require('../address/address.model');

const { paymentMethods } = require('../../constants/paymentMethod.constant');
const { orderStatus } = require('../../constants/orderStatus.constant');

const genrateOrderCode = () => {
    return `ORD-${Date.now()}`;
};

const checkout = async (userId, addressId, paymentMethod, note) => {
    return await sequelize.transaction(async (transaction) => {
        if (paymentMethod && !Object.values(paymentMethods).includes(paymentMethod)) {
            throw new Error('Invalid payment method');
        }

        // 1. Get cart
        const cart = await Cart.findOne({
            where: { user_id: userId },
            include: {
                model: CartItem,
                as: 'items',
                include: {
                    model: ProductVariant,
                    as: 'variant',
                },
            },
            transaction,
        });

        if (!cart || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        // 2. Get address
        const address = await Address.findByPk(addressId, { transaction });
        if (!address) {
            throw new Error('Address not found');
        }

        let total = 0;

        // 3. Create order
        const order = await Order.create({
            order_code: genrateOrderCode(),
            user_id: userId,

            receiver_name: address.receiver_name,
            phone: address.phone,
            city: address.city,
            ward: address.ward,
            detail_address: address.detail_address,

            payment_method: paymentMethod || paymentMethod.COD,

            note: note || null,

            total_price: 0,
            final_price: 0,

        }, { transaction });

        // 4. Create order items
        for (const item of cart.items) {
            const variant = item.variant;
            if (!variant) {
                throw new Error('Variant not found');
            }

            if (variant.stock < item.quantity) {
                throw new Error('Out of stock');
            }

            const price = Number(variant.price);

            total += price * item.quantity;

            await OrderItem.create({
                order_id: order.id,
                product_variant_id: variant.id,
                quantity: item.quantity,
                price,
            }, { transaction });

            // Trừ stock
            await variant.update({
                stock: variant.stock - item.quantity,
            }, { transaction });
        }

        // 5. Update order total price
        await order.update({
            total_price: total,
            final_price: total,
        }, { transaction });

        // 6. Clear cart
        await CartItem.destroy({
            where: { cart_id: cart.id },
            transaction,
        });

        return order;
    });
};

const getMyOrders = async (userId, query) => {
    const {
        page = 1,
        limit = 10,
        status,
        sort = "created_at:desc"
    } = query;
    
    const offset = (page - 1) * limit;

    const where = { user_id: userId };

    if (status) {
        where.status = status;
    }

    let orderSort = [['created_at', 'DESC']];

    if (sort) {
        const [field, direction] = sort.split(':');
        orderSort = [[field, direction.toUpperCase()]];
    }

    const { count, rows } = await Order.findAndCountAll({
        where,
        limit: Number(limit),
        offset: Number(offset),
        order: orderSort,

        include: [
            {
                model: OrderItem,
                as: 'items',
                attributes: ['id', 'quantity', 'price'],

                include: [
                    {
                        model: ProductVariant,
                        as: 'variant',
                        attributes: ['id', 'price'],

                        include: [
                            {
                                model: Product,
                                as: 'product',
                                attributes: ['id', 'name'],
                            },
                        ],
                    },
                ],
            },
        ],
    });

    // format
    const data =  rows.map(order => ({
        id: order.id,
        order_code: order.order_code,
        status: order.status,
        created_at: order.created_at,
        payment_status: order.payment_status,
        total_price: order.final_price,

        items: order.items.map(item => ({
            product_id: item.variant.product.id,
            product_name: item.variant.product.name,
            color: item.variant.color,
            size: item.variant.size,
            image: item.variant.image_url,
            quantity: item.quantity,
            price: item.price,
        })),
    }));

    return {
        data,
        pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            total_pages: Math.ceil(count / limit),
        },
    };
};

const getOrderDetail = async (userId, orderId) => {
    const order = await Order.findOne({
        where: {
            id: orderId,
            user_id: userId,
        },
        include: [
            {
                model: OrderItem,
                as: 'items',
                attributes: ['id', 'quantity', 'price'],

                include: [
                    {
                        model: ProductVariant,
                        as: 'variant',
                        attributes: ['id', 'color', 'size', 'image_url', 'price'],

                        include: [
                            {
                                model: Product,
                                as: 'product',
                                attributes: ['id', 'name'],
                            },
                        ],
                    },
                ],
            },
        ],
    });

    if (!order) {
        throw new Error('Order not found');
    }

    // format
    const formatted = {
        id: order.id,
        order_code: order.order_code,
        status: order.status,
        created_at: order.created_at,

        receiver_name: order.receiver_name,
        phone: order.phone,
        full_address: `${order.detail_address}, ${order.ward}, ${order.city}`,

        note: order.note,

        payment_method: order.payment_method,
        payment_status: order.payment_status,

        items: order.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,

            product_id: item.variant.product.id,
            product_name: item.variant.product.name,
            color: item.variant.color,
            size: item.variant.size,
            image: item.variant.image_url,
        })),

        total_price: order.total_price,
        shipping_fee: order.shipping_fee,
        final_price: order.final_price,  
    };

    return formatted;
};

const cancelOrder = async (userId, orderId) => {
    return await sequelize.transaction(async (transaction) => {
        // 1. Get order + items
        const order = await Order.findOne({
            where: {
                id: orderId,
                user_id: userId,
            },
            include: {
                model: OrderItem,
                as: 'items',
            },
            transaction,
        });

        if (!order) {
            throw new Error('Order not found');
        }

        // 2.Check status
        if (order.status !== orderStatus.PENDING) {
            throw new Error('Only pending orders can be cancelled');
        }

        // 3. Restore stock
        for (const item of order.items) {
            const variant = await ProductVariant.findByPk(
                item.product_variant_id, 
                { transaction }
            )
            
            if (!variant) continue;

            await variant.update({
                stock: variant.stock + item.quantity,
            }, { transaction });
        }

        // 4. Update order status
        await order.update({
            status: orderStatus.CANCELLED,
        }, { transaction });

        return order;
    });
};

module.exports = {
    checkout,
    getMyOrders,
    getOrderDetail,
    cancelOrder,
};