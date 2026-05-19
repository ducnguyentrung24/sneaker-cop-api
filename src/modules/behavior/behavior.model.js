const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Behavior = sequelize.define('Behavior', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    view_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    cart_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    purchase_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    score: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    }
}, {
    tableName: 'behaviors',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'product_id']
        }
    ]
});

module.exports = Behavior;