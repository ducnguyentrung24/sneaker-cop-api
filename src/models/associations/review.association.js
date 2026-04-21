const Review = require('../../modules/review/review.model');
const User = require('../../modules/user/user.model');
const Product = require('../../modules/product/product.model');
const Order = require('../../modules/order/order.model');

const initReviewAssociations = () => {
    // User - Review (1 - N)
    User.hasMany(Review, {
        foreignKey: 'user_id',
        as: 'reviews',
        onDelete: 'CASCADE',
    });

    Review.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user',
    });

    // Product - Review (1 - N)
    Product.hasMany(Review, {
        foreignKey: 'product_id',
        as: 'reviews',
        onDelete: 'CASCADE',
    });

    Review.belongsTo(Product, {
        foreignKey: 'product_id',
        as: 'product',
    });

    // Order - Review (1 - N)
    Order.hasMany(Review, {
        foreignKey: 'order_id',
        as: 'reviews',
        onDelete: 'CASCADE',
    });

    Review.belongsTo(Order, {
        foreignKey: 'order_id',
        as: 'order',
    });
};

module.exports = initReviewAssociations;