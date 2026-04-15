const Product = require('../../modules/product/product.model');
const ProductImage = require('../../modules/product/productImage.model');
const ProductVariant = require('../../modules/product/productVariant.model');

const initProductAssociations = () => {

    // Product - ProductImage (1 - N)
    Product.hasMany(ProductImage, {
        foreignKey: 'product_id',
        as: 'images',
        onDelete: 'CASCADE',
    });

    ProductImage.belongsTo(Product, {
        foreignKey: 'product_id',
        as: 'product',
        onDelete: 'CASCADE',
    });

    // Product - ProductVariant (1 - N)
    Product.hasMany(ProductVariant, {
        foreignKey: 'product_id',
        as: 'variants',
        onDelete: 'CASCADE',
    });

    ProductVariant.belongsTo(Product, {
        foreignKey: 'product_id',
        as: 'product',
        onDelete: 'CASCADE',
    });
};

module.exports = initProductAssociations;