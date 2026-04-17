const { set } = require('../../app');
const Address = require('./address.model');
const { Op } = require('sequelize');

const getAddresses = async (userId) => {
    return await Address.findAll({
        where: { user_id: userId },
        order: [
            ['is_default', 'DESC'],
            ['created_at', 'DESC']
        ]
    });
};

const createAddress = async (userId, data) => {
    const { receiver_name, phone, city, ward, detail_address, is_default } = data;

    const count = await Address.count({
        where: { user_id: userId }
    });

    if (count >= 3) {
        throw new Error("You can only have up to 3 addresses");
    }

    if (is_default === true) {
        await Address.update(
            { is_default: false },
            { where: { user_id: userId } }
        );
    }

    const address = await Address.create({
        user_id: userId,
        receiver_name,
        phone,
        city,
        ward,
        detail_address,
        is_default
    });

    return address;
};

const updateAddress = async (userId, addressId, data) => {
    const { receiver_name, phone, city, ward, detail_address, is_default } = data;

    const address = await Address.findByPk(addressId);
    if (!address) {
        throw new Error("Address not found");
    }

    if (address.user_id !== userId) {
        throw new Error("Unauthorized");
    }

    if (is_default === true) {
        await Address.update(
            { is_default: false },
            {
                where: {
                    user_id: userId,
                    id: { [Op.ne]: addressId }
                }
            }
        );
    }

    await address.update({
        receiver_name,
        phone,
        city,
        ward,
        detail_address,
        is_default
    });

    return address;
};

const setDefaultAddress = async (userId, addressId) => {
    const address = await Address.findByPk(addressId);
    if (!address) {
        throw new Error("Address not found");
    }

    if (address.user_id !== userId) {
        throw new Error("Unauthorized");
    }

    await Address.update(
        { is_default: false },
        {
            where: {
                user_id: userId,
                id: { [Op.ne]: addressId }
            }
        }
    );

    await address.update({ is_default: true });

    return address;
};

const deleteAddress = async (userId, addressId) => {
    const address = await Address.findByPk(addressId);
    if (!address) {
        throw new Error("Address not found");
    }

    if (address.user_id !== userId) {
        throw new Error("Unauthorized");
    }

    const wasDefault = address.is_default;

    await address.destroy();

    if (wasDefault) {
        const nextAddress = await Address.findOne({
            where: { user_id: userId },
            order: [['created_at', 'DESC']]
        });

        if (nextAddress) {
            await nextAddress.update({ is_default: true });
        }
    }

    return { message: "Address deleted successfully" };
};

module.exports = {
    getAddresses,
    createAddress,
    updateAddress,
    setDefaultAddress,
    deleteAddress
};