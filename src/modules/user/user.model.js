const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const { ROLES } = require("../../constants/role.constant");

const User = sequelize.define("User", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM,
        values: Object.values(ROLES),
        defaultValue: ROLES.CUSTOMER,
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    timestamps: true,
    tableName: "users",
    createdAt: "created_at",
    updatedAt: "updated_at",
});

module.exports = User;