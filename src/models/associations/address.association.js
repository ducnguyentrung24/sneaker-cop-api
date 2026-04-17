const Address = require('../../modules/address/address.model');
const User = require('../../modules/user/user.model');

const initAddressAssociations = () => {
    // User - Address (1 - N)
    User.hasMany(Address, {
        foreignKey: 'user_id',
        as: 'addresses',
        onDelete: 'CASCADE',
    });

    Address.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user',
    });
};

module.exports = initAddressAssociations;