const sequelize = require('../config/database');

// Load models
require('../modules/user/user.model');
require('../modules/brand/brand.model');
require('../modules/category/category.model');
require('../modules/product/product.model');
require('../modules/product/productImage.model');
require('../modules/product/productVariant.model');

// load associations
const initProductAssociations = require('./associations/product.association');

const initModels = () => {
    initProductAssociations();
};

module.exports = {
    sequelize,
    initModels,
};