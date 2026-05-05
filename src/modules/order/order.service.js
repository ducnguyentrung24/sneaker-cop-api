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

const processOrder = async ({
    userId,
    items,
    address,
    payment_method,
    note,
    transaction
}) => {
    let total = 0;

    const order = await Order.create({
        order_code: genrateOrderCode(),
        user_id: userId,

        receiver_name: address.receiver_name,
        phone: address.phone,
        city: address.city,
        ward: address.ward,
        detail_address: address.detail_address,

        payment_method: payment_method || paymentMethods.COD,
        note: note || null,

        total_price: 0,
        final_price: 0,
    }, { transaction });

    for (const { variant, quantity } of items) {
        if (!variant) throw new Error('Variant not found');
        if (variant.stock < quantity) throw new Error('Out of stock');

        const price = Number(variant.price);
        total += price * quantity;

        await OrderItem.create({
            order_id: order.id,
            product_variant_id: variant.id,
            quantity,
            price,
        }, { transaction });

        await variant.update({
            stock: variant.stock - quantity,
        }, { transaction });
    }

    await order.update({
        total_price: total,
        final_price: total,
    }, { transaction });

    return order;
};

const checkoutFromCart = async (userId, data) => {
    return await sequelize.transaction(async (transaction) => {
        const { address_id, payment_method, note, selected_item_ids } = data;

        if (payment_method && !Object.values(paymentMethods).includes(payment_method)) {
            throw new Error('Invalid payment method');
        }

        if (!selected_item_ids || !selected_item_ids.length) throw new Error('No items selected');

        // Get cart
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

        if (!cart || cart.items.length === 0) throw new Error('Cart is empty');

        // Get address
        const address = await Address.findByPk(address_id, { transaction });
        if (!address) throw new Error('Address not found');
        
        // Filter items
        const selectedItems = cart.items.filter(item =>
            selected_item_ids.includes(item.id)
        );

        if (!selectedItems.length) throw new Error('Selected items not found');

        // Map items
        const items = selectedItems.map(item => ({
            variant: item.variant,
            quantity: item.quantity,
        }));

        // create order
        const order = await processOrder({
            userId,
            items,
            address,
            payment_method,
            note,
            transaction,
        });

        const validItemIds = selectedItems.map(item => item.id);

        // Clear cart
        await CartItem.destroy({
            where: {
                id: validItemIds,
                cart_id: cart.id
            },
            transaction,
        });

        return order;
    });
};

const checkoutFromBuyNow = async (userId, data) => {
    return await sequelize.transaction(async (transaction) => {
        const { variant_id, quantity, address_id, payment_method, note } = data;

        if (payment_method && !Object.values(paymentMethods).includes(payment_method)) {
            throw new Error('Invalid payment method');
        }

        if (quantity <= 0) throw new Error('Invalid quantity');

        const variant = await ProductVariant.findByPk(variant_id, { transaction });
        if (!variant) throw new Error('Variant not found');

        const address = await Address.findByPk(address_id, { transaction });
        if (!address) throw new Error('Address not found');

        // create order
        const order = await processOrder({
            userId,
            items: [{ variant, quantity }],
            address,
            payment_method,
            note,
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
    
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const where = { user_id: userId };

    if (status) where.status = status;

    let orderSort = [['created_at', 'DESC']];

    if (sort) {
        const [field, direction] = sort.split(':');
        orderSort = [[field, direction.toUpperCase()]];
    }

    const { count, rows } = await Order.findAndCountAll({
        where,
        limit: limitNumber,
        offset,
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

    const totalPages = Math.ceil(count / limitNumber);

    return {
        data,
        pagination: {
            total: count,
            page: pageNumber,
            limit: limitNumber,
            totalPages,
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

    if (!order) throw new Error('Order not found');

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
        // Get order + items
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

        if (!order) throw new Error('Order not found');
        // Check status
        if (order.status !== orderStatus.PENDING) throw new Error('Only pending orders can be cancelled');

        // Restore stock
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

        // Update order status
        await order.update({
            status: orderStatus.CANCELLED,
        }, { transaction });

        return order;
    });
};

module.exports = {
    checkoutFromCart,
    checkoutFromBuyNow,
    getMyOrders,
    getOrderDetail,
    cancelOrder,
};