const User = require('./user.model');
const { hashPassword, comparePassword } = require('../../utils/hash');
const { get } = require('./user.route');

const getProfile = async (userId) => {
    const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
    }); 
    if (!user) throw new Error('User not found');

    return user;
};

const updateProfile = async (userId, data) => {
    const { full_name, phone } = data;

    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

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
    if (!user) throw new Error('User not found');

    const isMatch = await comparePassword(old_password, user.password);
    if (!isMatch) throw new Error('Old password is incorrect');

    const hashedPassword = await hashPassword(new_password);
    await user.update({ password: hashedPassword });

    return {
        message: 'Password changed successfully',
    }
};

// Admin
const getAllUsers = async (query) => {
    const {
        page = 1,
        limit = 10,
        keyword,
        is_active,
        sort= 'created_at:desc',
    } = query;

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const where = {};

    if (is_active !== undefined) where.is_active = is_active === 'true';

    if (keyword) {
        where[Op.or] = [
            {
                full_name: {
                    [Op.iLike]: `%${keyword}%`,
                },
            },
            {
                email: {
                    [Op.iLike]: `%${keyword}%`,
                },
            },
            {
                phone: {
                    [Op.iLike]: `%${keyword}%`,
                },
            }
        ];
    }

    let orderSort = [['created_at', 'DESC']];
    if (sort) {
        const [field, order] = sort.split(':');
        orderSort = [[field, order.toUpperCase()]];
    }

    const { count, rows } = await User.findAndCountAll({
        where,

        attributes: [
            'id',
            'email',
            'full_name',
            'phone',
            'role',
            'is_active',
            'created_at',
        ],


        limit: limitNumber,
        offset,
        order: orderSort,
    });

    const data = rows.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
    }));

    const totalPages = Math.ceil(count / limitNumber);

    return {
        data,
        pagination: {
            total: count,
            page: pageNumber,
            limit: limitNumber,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
    };
};

const createUser = async (data) => {
    const { email, password, full_name, phone, role, is_active } = data;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) throw new Error('Email already exists');

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
        email,
        password: hashedPassword,
        full_name,
        phone: phone || null,
        role,
        is_active,
    });

    return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
    };
};

const updateUser = async (userId, data) => {
    const { full_name, phone, role } = data;

    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    if (full_name !== undefined) user.full_name = full_name;
    if (phone !== undefined) user.phone = phone || null;
    if (role !== undefined) user.role = role;

    await user.save();

    return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
    };
};

const updateUserStatus = async (userId, is_active) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    await user.update({ is_active });

    return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
    };
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    getAllUsers,
    createUser,
    updateUser,
    updateUserStatus,
};