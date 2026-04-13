const User = require("../user/user.model");
const { hashPassword, comparePassword } = require("../../utils/hash");
const { generateToken } = require("../../utils/jwt");

const register = async (data) => {
    const { email, password, full_name } = data;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        throw new Error("Email already exists");
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
        email,
        password: hashedPassword,
        full_name,
    });

    return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
    }
};

const login = async (data) => {
    const { email, password } = data;

    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new Error("Invalid email or password");
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        throw new Error("Invalid email or password");
    }

    const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
    });

    return {
        user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
        },
        token,
    };
};

module.exports = {
    register,
    login,
};