const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Check if SMTP credentials are the default placeholders or missing
    const isMock = !process.env.SMTP_USER || process.env.SMTP_USER === 'your_user' || process.env.SMTP_USER.includes('example');

    if (isMock) {
        console.log('---------------------------------------------------------');
        console.log('📧 DEVELOPMENT MODE: Email sending skipped (No SMTP Config)');
        console.log(`TO: ${options.email}`);
        console.log(`SUBJECT: ${options.subject}`);
        console.log('MESSAGE:');
        console.log(options.message);
        console.log('---------------------------------------------------------');
        return; // Skip real email sending
    }

    // Real SMTP Transporter (Production/Mailtrap)
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
        port: process.env.SMTP_PORT || 2525,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const message = {
        from: `${process.env.FROM_NAME || 'HEMS Portal'} <${process.env.FROM_EMAIL || 'noreply@hems.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message
    };

    try {
        const info = await transporter.sendMail(message);
        console.log('Message sent: %s', info.messageId);
    } catch (err) {
        console.error('SMTP Error:', err.message);
        // Still log to console so the link isn't lost if SMTP fails unexpectedly
        console.log('---------------------------------------------------------');
        console.log('fallback link:', options.message);
        console.log('---------------------------------------------------------');
        throw err;
    }
};

module.exports = sendEmail;
