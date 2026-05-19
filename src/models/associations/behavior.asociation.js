const Behavior = require('../../modules/behavior/behavior.model');
const User = require('../../modules/user/user.model');
const Product = require('../../modules/product/product.model');

const initBehaviorAssociations = () => {
    // User - Behavior (1 - N)
    User.hasMany(Behavior, {
        foreignKey: 'user_id',
        as: 'behaviors',
        onDelete: 'CASCADE',
    });

    Behavior.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user',
    });

    // Product - Behavior (1 - N)
    Product.hasMany(Behavior, {
        foreignKey: 'product_id',
        as: 'behaviors',
        onDelete: 'CASCADE',
    });

    Behavior.belongsTo(Product, {
        foreignKey: 'product_id',
        as: 'product',
    });
};

module.exports = initBehaviorAssociations;  