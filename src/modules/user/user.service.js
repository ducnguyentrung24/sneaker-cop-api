const User = require('./user.model');
const { hashPassword, comparePassword } = require('../../utils/hash');

const getProfile = async (userId) => {
    const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
    }); 
    if (!user) {
        throw new Error('User not found');
    }

    return user;
};

const updateProfile = async (userId, data) => {
    const { full_name, phone } = data;

    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error('User not found');
    }

    await user.update({ 
        full_name,
        phone
    });

    return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
    };
};

const changePassword = async (userId, data) => {
    const { old_password, new_password } = data;

    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const isMatch = await comparePassword(old_password, user.password);
    if (!isMatch) {
        throw new Error('Old password is incorrect');
    }

    const hashedPassword = await hashPassword(new_password);
    await user.update({ 
        password: hashedPassword,
    });

    return {
        message: 'Password changed successfully',
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
};