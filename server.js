const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000; // Use Heroku's port or default to 5000

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); // Enable CORS for all routes

// Configure Nodemailer for Yahoo
const transporter = nodemailer.createTransport({
    service: 'yahoo',
    auth: {
        user: process.env.YAHOO_EMAIL, // Use environment variable for Yahoo email
        pass: process.env.YAHOO_APP_PASSWORD // Use environment variable for Yahoo App Password
    }
});

// Endpoint to send emails
app.post('/send-email', async (req, res) => {
    const { to, subject, text } = req.body;

    // Validate request body
    if (!to || !subject || !text) {
        return res.status(400).send('Missing required fields: to, subject, text');
    }

    const mailOptions = {
        from: process.env.YAHOO_EMAIL, // Use environment variable for sender email
        to,
        subject,
        text
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
        res.status(200).send('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Error sending email');
    }
});

// Default route
app.get('/', (req, res) => {
    res.send('Welcome to the Appointment Booking API!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});