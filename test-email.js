const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'yahoo',
    auth: {
        user: 'thirushaun74@yahoo.com', // Your Yahoo email
        pass: 'tnqcbjvhjvuieevs'        // Your Yahoo App Password
    }
});

const mailOptions = {
    from: 'thirushaun74@yahoo.com', // Your Yahoo email
    to: 'thirushaun74@yahoo.com',   // Send a test email to yourself
    subject: 'Test Email',
    text: 'This is a test email from Nodemailer.'
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Error sending email:', error);
    } else {
        console.log('Email sent:', info.response);
    }
});