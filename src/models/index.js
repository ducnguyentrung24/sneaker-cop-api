const sequelize = require('../config/database');

// Load models
require('../modules/user/user.model');
require('../modules/brand/brand.model');
require('../modules/category/category.model');
require('../modules/product/product.model');
require('../modules/product/productImage.model');
require('../modules/product/productVariant.model');
require('../modules/cart/cart.model');
require('../modules/cart/cartItem.model');

// load associations
const initProductAssociations = require('./associations/product.association');
const initCartAssociations = require('./associations/cart.association');

const initModels = () => {
    initProductAssociations();
    initCartAssociations();
};

module.exports = {
    sequelize,
    initModels,
};