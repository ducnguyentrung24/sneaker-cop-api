const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    brand_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    base_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    discount_percent: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    thumbnail: {
        type: DataTypes.TEXT,
    },
    sold: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    }
}, {
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Product;