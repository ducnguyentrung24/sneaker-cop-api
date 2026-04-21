const Order = require('../../modules/order/order.model');
const OrderItem = require('../../modules/order/orderItem.model');
const ProductVariant = require('../../modules/product/productVariant.model');
const User = require('../../modules/user/user.model');

const initOrderAssociations = () => {
    // User - Order (1 - N)
    User.hasMany(Order, {
        foreignKey: 'user_id',
        as: 'orders',
        onDelete: 'CASCADE',
    });

    Order.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user',
    });

    // Order - OrderItem (1 - N)
    Order.hasMany(OrderItem, {
        foreignKey: 'order_id',
        as: 'items',
        onDelete: 'CASCADE',
    });

    OrderItem.belongsTo(Order, {
        foreignKey: 'order_id',
        onDelete: 'CASCADE',
    });

    // OrderItem - ProductVariant (N - 1)
    ProductVariant.hasMany(OrderItem, {
        foreignKey: 'product_variant_id',
        as: 'order_items',
        onDelete: 'CASCADE',
    });

    OrderItem.belongsTo(ProductVariant, {
        foreignKey: 'product_variant_id',
        as: 'variant',
        onDelete: 'CASCADE',
    });
};

module.exports = initOrderAssociations;
