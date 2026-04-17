const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Address = sequelize.define('Address', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    receiver_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ward: {
        type: DataTypes.STRING,
        allowNull: false
    },
    detail_address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'addresses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Address;