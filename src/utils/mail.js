const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
});

const sendEmail = async ({ to, subject, html }) => {
    await transporter.sendMail({
        from: `${process.env.EMAIL_FROM} <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
};

module.exports = {
    sendEmail,
};