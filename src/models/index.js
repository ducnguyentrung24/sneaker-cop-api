const sequelize = require('../config/database');

// Load models
require('../modules/user/user.model');
require('../modules/address/address.model');
require('../modules/brand/brand.model');
require('../modules/category/category.model');
require('../modules/product/product.model');
require('../modules/product/productImage.model');
require('../modules/product/productVariant.model');
require('../modules/cart/cart.model');
require('../modules/cart/cartItem.model');

// load associations
const initAddressAssociations = require('./associations/address.association');
const initProductAssociations = require('./associations/product.association');
const initCartAssociations = require('./associations/cart.association');

const initModels = () => {
    initAddressAssociations();
    initProductAssociations();
    initCartAssociations();
};

module.exports = {
    sequelize,
    initModels,
};