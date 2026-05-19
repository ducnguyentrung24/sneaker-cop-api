const Product = require('../../modules/product/product.model');
const ProductImage = require('../../modules/product/productImage.model');
const ProductVariant = require('../../modules/product/productVariant.model');
const Category = require('../../modules/category/category.model');
const Brand = require('../../modules/brand/brand.model');

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

    // Product - Category (N - 1)
    Category.hasMany(Product, {
        foreignKey: 'category_id',
        as: 'products',
    });

    Product.belongsTo(Category, {
        foreignKey: 'category_id',
        as: 'category',
    });

    // Product - Brand (N - 1)
    Brand.hasMany(Product, {
        foreignKey: 'brand_id',
        as: 'products',
    });

    Product.belongsTo(Brand, {
        foreignKey: 'brand_id',
        as: 'brand',
    });
};

module.exports = initProductAssociations;