const User = require("../user/user.model");
const PasswordResetOtp = require("./passwordResetOtp.model");

const { hashPassword, comparePassword } = require("../../utils/hash");
const { generateToken } = require("../../utils/jwt");
const { sendEmail } = require("../../utils/mail");

const register = async (data) => {
    const { email, password, full_name } = data;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) throw new Error("Email này đã được đăng ký");

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
    if (!user) throw new Error("Email hoặc mật khẩu không đúng");

    // Check if the account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const remainingMinutes = Math.ceil(
            (new Date(user.locked_until) - new Date()) / (1000 * 60)
        );

        throw new Error(`Tài khoản này bị khóa ${remainingMinutes} phút do nhập sai mật khẩu nhiều lần.`);
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        const failedAttempts = user.failed_login_attempts + 1;

        if (failedAttempts >= 5) {
            const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes

            await user.update({
                failed_login_attempts: 0,
                locked_until: lockUntil,
            });

            throw new Error("Bạn đã nhập sai quá 5 lần. Tài khoản bị khóa trong 15 phút.");
        }

        await user.update({ failed_login_attempts: failedAttempts });

        throw new Error(`Email hoặc mật khẩu không đúng. Bạn còn ${5 - failedAttempts} lần thử.`);
    }

    await user.update({
        failed_login_attempts: 0,
        locked_until: null,
    });

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
            role: user.role,
        },
        token,
    };
};

const forgotPassword = async (email) => {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error("Email này chưa được đăng ký");

    // Check resend cooldown
    const latesOtp = await PasswordResetOtp.findOne({
        where: { email },
        order: [['created_at', 'DESC']],
    });

    const cooldownSeconds = 60;

    // Check time
    if (latesOtp) {
        const now = new Date();
        const lastSentAt = new Date(latesOtp.created_at);
        const diffInSeconds = Math.floor(
            (now.getTime() - lastSentAt.getTime()) / 1000
        );

        if (diffInSeconds < cooldownSeconds) {
            throw new Error(`Vui lòng chờ ${cooldownSeconds - diffInSeconds} giây trước khi gửi lại OTP`);
        };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + 5);

    await PasswordResetOtp.update(
        { is_used: true },
        {
            where: {
                email,
                is_used: false,
            },
        }
    );

    await PasswordResetOtp.create({
        email,
        otp,
        expires_at: expiredAt,
        is_used: false,
    });

    setImmediate(async () => {
        try {
            await sendEmail({
                to: email,
                subject: 'Sneaker Cop - OTP đặt lại mật khẩu',
                html: `
                    <div style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
                        <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="background: #ffffff; padding: 24px; text-align: center;">
                                <h1 style="color: black; margin: 0; font-size: 28px;">
                                    Sneaker <span style="color: #F97316;">COP</span>
                                </h1>
                            </div>

                            <div style="height: 4px; width: 100%; background: #F97316; margin-top: 1px"></div>

                            <!-- Body -->
                            <div style="padding: 40px; color: #333;">
                                <h2 style="margin-top: 0; color: #111827;">Đặt lại mật khẩu</h2>

                                <p style="font-size: 16px; line-height: 1.6;">
                                    Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
                                </p>

                                <p style="font-size: 16px; margin-bottom: 10px;">Mã OTP của bạn là:</p>
                                <!-- OTP BOX -->
                                <div style="text-align: center; margin: 30px 0;">
                                    <div style="display: inline-block; background: #f3f4f6; padding: 18px 32px; border-radius: 12px; border: 2px dashed #111827; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #111827;">
                                        ${otp}
                                    </div>
                                </div>

                                <p style="font-size: 15px; color: #555;">
                                    OTP sẽ hết hạn sau <b>3 phút</b>.
                                </p>

                                <p style="font-size: 15px; color: #555; line-height: 1.6;">
                                    Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                                </p>
                            </div>

                            <!-- Footer -->
                            <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 13px; color: #888;">
                                2026 Sneaker Cop. All rights reserved.
                            </div>
                        </div>
                    </div>
                `
            });
        } catch(error) {
            console.error("Send OTP email failed:", error.message);
        }
    })

    return {
        email,
        expires_in_minutes: 3,
        resend_after_seconds: cooldownSeconds,
    };
};

const resetPassword = async (data) => {
    const { email, otp, new_password } = data;

    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error("Email này chưa được đăng ký");

    const otpRecord = await PasswordResetOtp.findOne({
        where: {
            email,
            otp,
            is_used: false,
        },
        order: [['created_at', 'DESC']],
    });

    if (!otpRecord) throw new Error("OTP không hợp lệ");
    if (otpRecord.expires_at < new Date()) throw new Error("OTP đã hết hạn");

    const hashedPassword = await hashPassword(new_password);

    await user.update({ password: hashedPassword });
    await otpRecord.update({ is_used: true });

    return {
        email,
    };
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
};