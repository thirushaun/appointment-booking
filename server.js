require('dotenv').config(); // Load environment variables
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); // Enable CORS for all routes
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the public folder

// Configure Nodemailer for Yahoo
const transporter = nodemailer.createTransport({
    service: 'yahoo',
    auth: {
        user: process.env.YAHOO_EMAIL, // Load from environment variable
        pass: process.env.YAHOO_APP_PASSWORD // Load from environment variable
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

// Endpoint to save appointments
app.post('/appointments', (req, res) => {
    const appointmentData = req.body;

    // Read existing appointments from db.json
    const dbPath = path.join(__dirname, 'db.json');
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading db.json:', err);
            return res.status(500).send('Error reading database');
        }

        const appointments = JSON.parse(data);
        appointments.push(appointmentData);

        // Write updated appointments to db.json
        fs.writeFile(dbPath, JSON.stringify(appointments, null, 2), (err) => {
            if (err) {
                console.error('Error writing to db.json:', err);
                return res.status(500).send('Error saving appointment');
            }

            res.status(200).send('Appointment saved successfully');
        });
    });
});

// Endpoint to fetch appointments
app.get('/appointments', (req, res) => {
    const dbPath = path.join(__dirname, 'db.json');
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading db.json:', err);
            return res.status(500).send('Error reading database');
        }

        const appointments = JSON.parse(data);
        res.status(200).json(appointments);
    });
});

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
