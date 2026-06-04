const { sequelize } = require('../../models');
const { Op } = require('sequelize');

const Order = require('./order.model');
const OrderItem = require('./orderItem.model');
const Cart = require('../cart/cart.model');
const CartItem = require('../cart/cartItem.model');
const Product = require('../product/product.model');
const ProductVariant = require('../product/productVariant.model');
const Address = require('../address/address.model');
const OrderStatusLog = require('./orderStatusLog.model');
const User = require('../user/user.model');

const { paymentMethods , paymentStatus} = require('../../constants/paymentMethod.constant');
const { orderStatus } = require('../../constants/orderStatus.constant');
const { ORDER_FLOW } = require('../../constants/orderFlow.constant');

const behaviorService = require("../behavior/behavior.service");
const { behaviorTypes } = require('../../constants/behavior.constant');

const calculatePurchasePrice = (variant, product) => {
    const variantPrice = Number(variant.price || 0);
    const discountPrice = Number(product.discount_percent || 0);

    if (!discountPrice || discountPrice <= 0) return variantPrice;

    const finalPrice = variantPrice * (1 - discountPrice / 100);

    return Math.round(finalPrice);
};

const genrateOrderCode = () => {
    return `#ORD-${Date.now()}`;
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

        status: orderStatus.PENDING,

        total_price: 0,
        final_price: 0,
    }, { transaction });

    await OrderStatusLog.create({
        order_id: order.id,
        from_status: orderStatus.PENDING,
        to_status: orderStatus.PENDING,
        changed_by: userId,
        note: 'Order created',
    }, { transaction });


    for (const { variant, quantity } of items) {
        if (!variant) throw new Error('Không tìm thấy biến thể sản phẩm');
        if (variant.stock < quantity) throw new Error('Số lượng tồn kho không đủ');

        const product = 
            variant.product;
            // await Product.findByPk(variant.product_id, { transaction });
        if (!product) throw new Error('Không tìm thấy sản phẩm');

        const price = calculatePurchasePrice(variant, product);
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

        // Track behavior to purchase behavior
        await behaviorService.trackBehavior(
            userId,
            variant.product_id,
            behaviorTypes.PURCHASE
        );
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
            throw new Error('Phương thức thanh toán không hợp lệ');
        }

        if (!selected_item_ids || !selected_item_ids.length) throw new Error('Không có sản phẩm nào được chọn');

        // Get cart
        const cart = await Cart.findOne({
            where: { user_id: userId },
            include: {
                model: CartItem,
                as: 'items',
                include: {
                    model: ProductVariant,
                    as: 'variant',
                    include: {
                        model: Product,
                        as: 'product',
                    },
                },
            },
            transaction,
        });

        if (!cart || cart.items.length === 0) throw new Error('Giỏ hàng trống');

        // Get address
        const address = await Address.findByPk(address_id, { transaction });
        if (!address) throw new Error('Không tìm thấy địa chỉ');
        
        // Filter items
        const selectedItems = cart.items.filter(item =>
            selected_item_ids.includes(item.id)
        );

        if (!selectedItems.length) throw new Error('Không có sản phẩm nào được chọn');

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
        if (payment_method === paymentMethods.COD) {
            await CartItem.destroy({
                where: {
                    id: validItemIds,
                    cart_id: cart.id
                },
                transaction,
            });
        }

        return order;
    });
};

const checkoutFromBuyNow = async (userId, data) => {
    return await sequelize.transaction(async (transaction) => {
        const { variant_id, quantity, address_id, payment_method, note } = data;

        if (payment_method && !Object.values(paymentMethods).includes(payment_method)) {
            throw new Error('Không tìm thấy phương thức thanh toán');
        }

        if (quantity <= 0) throw new Error('Số lượng không hợp lệ');

        const variant = await ProductVariant.findByPk(variant_id, {
            include: {
                model: Product,
                as: 'product',
            },
            transaction,
        });

        if (!variant) throw new Error('Không tìm thấy biến thể sản phẩm');

        const address = await Address.findByPk(address_id, { transaction });
        if (!address) throw new Error('Không tìm thấy địa chỉ');

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

const checkoutFromReorder = async (userId, data) => {
    return await sequelize.transaction(async (transaction) => {
        const { items, address_id, payment_method, note } = data;

        if (payment_method && !Object.values(paymentMethods).includes(payment_method)) {
            throw new Error('Phuong thức thanh toán không hợp lệ');
        }

        if (!items || !items.length) throw new Error('Không có sản phẩm nào được chọn để đặt hàng lại');

        const address = await Address.findByPk(address_id, { transaction });
        if (!address) throw new Error('Không tìm thấy địa chỉ');

        const orderItems = [];
        for (const item of items) {
            const { variant_id, quantity } = item;

            if (!variant_id) throw new Error('Variant ID is required');
            if (!quantity || quantity <= 0) throw new Error('Số luong không hợp lệ');

            const variant = await ProductVariant.findByPk(variant_id, { 
                include: {
                    model: Product,
                    as: 'product',
                },
                transaction,
            });

            if (!variant) throw new Error('Không tìm thấy biến thể sản phẩm');
            if (variant.stock < quantity) throw new Error('Số lượng tồn kho không đủ');

            orderItems.push({ variant, quantity });
        }

        const order = await processOrder({
            userId,
            items: orderItems,
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
        sort = "created_at:desc",
        keyword,
    } = query;
    
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const where = { user_id: userId };

    if (status) where.status = status;

    if (keyword) {
        where.order_code = {
            [Op.iLike]: `%${keyword}%`
        };
    }

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
        distinct: true,

        include: [
            {
                model: OrderItem,
                as: 'items',
                attributes: ['id', 'quantity', 'price'],

                include: [
                    {
                        model: ProductVariant,
                        as: 'variant',
                        attributes: ['id', 'price', 'color', 'size', 'image_url'],

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
            variant_id: item.variant.id,

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
                                attributes: ['id', 'thumbnail', 'name'],
                            },
                        ],
                    },
                ],
            },
            {
                model: OrderStatusLog,
                as: 'status_logs',
                attributes: ['id', 'from_status', 'to_status', 'note', 'created_at'],
            },
        ],
        order: [
            [
                { model: OrderStatusLog, as: 'status_logs' },
                'created_at',
                'ASC',
            ],
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

        total_price: order.total_price,
        shipping_fee: order.shipping_fee,
        final_price: order.final_price,

        items: order.items.map(item => ({
            id: item.id,
            variant_id: item.variant.id,

            quantity: item.quantity,
            price: item.price,

            product_id: item.variant.product.id,
            product_name: item.variant.product.name,
            color: item.variant.color,
            size: item.variant.size,
            image: item.variant.image_url,
        })),

        status_logs: order.status_logs.map(log => ({
            id: log.id,
            from_status: log.from_status,
            to_status: log.to_status,
            note: log.note,
            created_at: log.created_at,
        })),
    };

    return formatted;
};

const cancelOrder = async (userId, orderId) => {
    return await sequelize.transaction(async (transaction) => {
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

        if (!order) throw new Error('Không tìm thấy đơn hàng');
        if (order.status !== orderStatus.PENDING && order.status !== orderStatus.PROCESSING) throw new Error('Only pending and processing orders can be cancelled');

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

        const oldStatus = order.status;

        // Update order status
        await order.update({
            status: orderStatus.CANCELLED,
        }, { transaction });

        // Create order status log
        await OrderStatusLog.create({
            order_id: order.id,
            from_status: oldStatus,
            to_status: orderStatus.CANCELLED,
            changed_by: userId,
            note: 'Đơn hàng bị hủy bởi khách hàng',
        }, { transaction });

        return order;
    });
};

// Admin
const getAllOrders = async (query) => {
    const {
        page = 1,
        limit = 10,
        status,
        keyword,
        from_date,
        to_date,
        sort = "created_at:desc",
    } = query;

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const where = {};

    if (status) where.status = status;

    if (keyword) {
        where[Op.or] = [
            {
                order_code: {
                    [Op.iLike]: `%${keyword}%`
                },
            },
            {
                receiver_name: {
                    [Op.iLike]: `%${keyword}%`
                },
            },
        ]
    }

    if (from_date || to_date) {
        where.created_at = {};

        if (from_date) where.created_at[Op.gte] = new Date(from_date);
        if (to_date) {
            const endDate = new Date(to_date);
            endDate.setHours(23, 59, 59, 999);
            where.created_at[Op.lte] = endDate;
        }
    }

    let orderSort = [['created_at', 'DESC']];

    if (sort) {
        const [field, direction] = sort.split(':');
        orderSort = [[field, direction.toUpperCase()]];
    }

    const { count, rows } = await Order.findAndCountAll({
        where,

        attributes: [
            'id',
            'order_code',
            'receiver_name',
            'final_price',
            'payment_status',
            'status',
            'created_at',
        ],

        limit: limitNumber,
        offset,
        order: orderSort,
    });

    const data = rows.map(order => ({
        id: order.id,
        order_code: order.order_code,
        receiver_name: order.receiver_name,
        order_date: order.created_at,
        total_price: order.final_price,
        payment_status: order.payment_status,
        status: order.status,
    }));

    const totalPages = Math.ceil(count / limitNumber);

    return {
        data,
        pagination: {
            total: count,
            page: pageNumber,
            limit: limitNumber,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
    };
};

const getAdminOrderDetail = async (orderId) => {
    const order = await Order.findByPk(orderId, {
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'full_name', 'email', 'phone'],
            },
            {
                model: OrderItem,
                as: 'items',
                attributes: ['id', 'product_variant_id', 'quantity', 'price'],
                include: [
                    {
                        model: ProductVariant,
                        as: 'variant',
                        attributes: ['id', 'color', 'size', 'image_url', 'price'],
                        include: [
                            {
                                model: Product,
                                as: 'product',
                                attributes: ['id', 'thumbnail', 'name'],
                            },
                        ],
                    },
                ],
            },
            {
                model: OrderStatusLog,
                as: 'status_logs',
                attributes: ['id', 'from_status', 'to_status', 'changed_by', 'note', 'created_at'],
                include: [
                    {
                        model: User,
                        as: 'changed_by_user',
                        attributes: ['id', 'full_name', 'email'],
                    },
                ],
            },
        ],
        order: [
            [
                { model: OrderStatusLog, as: 'status_logs' },
                'created_at',
                'ASC',
            ],
        ],
    });

    if (!order) throw new Error('Không tìm thấy đơn hàng');

    const formatted = {
        id: order.id,
        order_code: order.order_code,

        user_id: order.user_id,

        user: order.user
        ? {
            id: order.user.id,
            full_name: order.user.full_name,
            email: order.user.email,
            phone: order.user.phone,
        }
        : null,

        receiver_name: order.receiver_name,
        phone: order.phone,
        city: order.city,
        ward: order.ward,
        full_address: `${order.detail_address}, ${order.ward}, ${order.city}`,

        note: order.note,

        payment_method: order.payment_method,
        payment_status: order.payment_status,

        status: order.status,

        total_price: Number(order.total_price),
        shipping_fee: Number(order.shipping_fee),
        final_price: Number(order.final_price),

        created_at: order.created_at,

        items: order.items.map(item => ({
            id: item.id,

            product_variant_id: item.product_variant_id,

            product_id: item.variant?.product?.id,
            product_name: item.variant?.product?.name,

            color: item.variant?.color,
            size: item.variant?.size,
            image: item.variant?.image_url,

            quantity: item.quantity,
            price: item.price,
            subtotal: Number(item.price) * item.quantity,
        })),

        status_logs: order.status_logs.map(log => ({
            id: log.id,
            from_status: log.from_status,
            to_status: log.to_status,
            changed_by: log.changed_by,
            
            changed_by_user: log.changed_by_user
            ? {
                id: log.changed_by_user.id,
                full_name: log.changed_by_user.full_name,
                email: log.changed_by_user.email,
            }
            : null,

            note: log.note,
            created_at: log.created_at,
        })),
    };

    return formatted;
};

const updateOrderStatus = async (orderId, adminId, data) => {
    return await sequelize.transaction(async (transaction) => {
        const { status, note } = data;

        if (status === orderStatus.CANCELLED && !note) throw new Error('Note is required when cancelling an order');

        const order = await Order.findByPk(orderId, {
            include: {
                model: OrderItem,
                as: 'items',
            },
            transaction,
        });

        if (!order) throw new Error('Không tìm thấy đơn hàng');

        const currentStatus = order.status;

        const allowedStatuses = ORDER_FLOW[currentStatus] || [];
        if (!allowedStatuses.includes(status)) throw new Error(`Không thể chuyển trạng thái từ ${currentStatus} sang ${status}`);

        if (status === orderStatus.CANCELLED) {
            for (const item of order.items) {
                const variant = await ProductVariant.findByPk(
                    item.product_variant_id,
                    { transaction }
                );

                if (!variant) continue;

                await variant.update({
                    stock: variant.stock + item.quantity,
                }, { transaction });
            }
        }

        const updateData = { status };
        if (status === orderStatus.COMPLETED) {
            updateData.payment_status = paymentStatus.PAID;
        }

        await order.update(updateData, { transaction });

        // Update sold
        if (currentStatus !== orderStatus.COMPLETED && status === orderStatus.COMPLETED) {
            for (const item of order.items) {
                const variant = await ProductVariant.findByPk(
                    item.product_variant_id,
                    { transaction }
                );

                if (!variant) continue;

                await ProductVariant.increment(
                    { sold: item.quantity },
                    {
                        where: { id: item.product_variant_id },
                        transaction,
                    }
                );

                await Product.increment(
                    { sold: item.quantity },
                    {
                        where: { id: variant.product_id },
                        transaction,
                    }
                );
            }
        }

        await OrderStatusLog.create({
            order_id: order.id,
            from_status: currentStatus,
            to_status: status,
            changed_by: adminId,
            note: note || `Đã chuyển trạng thái sang ${status} bởi admin`,
        }, { transaction });

        return order;
    });
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