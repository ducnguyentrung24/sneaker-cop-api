const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const { orderStatus } = require('../../constants/orderStatus.constant');
const { paymentMethods, paymentStatus } = require('../../constants/paymentMethod.constant');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    order_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    receiver_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    ward: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    detail_address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    total_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
    },
    shipping_fee: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
    },
    final_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
    },
    payment_method: {
        type: DataTypes.ENUM,
        values: Object.values(paymentMethods),
        defaultValue: paymentMethods.COD,
    },
    payment_status: {
        type: DataTypes.ENUM,
        values: Object.values(paymentStatus),
        defaultValue: paymentStatus.UNPAID,
    },
    note: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM,
        values: Object.values(orderStatus),
        defaultValue: orderStatus.PENDING,
    },
}, {
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Order;