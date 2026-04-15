const User = require('../../modules/user/user.model');
const Cart = require('../../modules/cart/cart.model');
const CartItem = require('../../modules/cart/cartItem.model');
const ProductVariant = require('../../modules/product/productVariant.model');

const initCartAssociations = () => {
    // User - Cart (1 - 1)
    User.hasOne(Cart, {
        foreignKey: 'user_id',
        as: 'cart',
        onDelete: 'CASCADE',
    });

    Cart.belongsTo(User, {
        foreignKey: 'user_id',
        onDelete: 'CASCADE',
    });

    // Cart - CartItem (1 - N)
    Cart.hasMany(CartItem, {
        foreignKey: 'cart_id',
        as: 'items',
        onDelete: 'CASCADE',
    });

    CartItem.belongsTo(Cart, {
        foreignKey: 'cart_id',
        onDelete: 'CASCADE',
    });

    // CartItem - ProductVariant (N - 1)
    CartItem.belongsTo(ProductVariant, {
        foreignKey: 'product_variant_id',
        as: 'variant',
        onDelete: 'CASCADE',
    });
};

module.exports = initCartAssociations;