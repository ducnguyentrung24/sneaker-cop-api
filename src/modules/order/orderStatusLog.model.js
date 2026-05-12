const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const OrderStatusLog = sequelize.define('OrderStatusLog', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    from_status: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    to_status: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    changed_by: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'order_status_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
});

module.exports = OrderStatusLog;