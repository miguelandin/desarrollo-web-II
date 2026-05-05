import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

export const sendVerificationEmail = async (email, code) => {
    await transporter.sendMail({
        from: process.env.MAIL_FROM || 'noreply@bildyapp.com',
        to: email,
        subject: 'Verifica tu cuenta — BildyApp',
        html: `<p>Tu código de verificación es: <strong>${code}</strong></p>`
    });
};
