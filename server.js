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
        user: process.env.YAHOO_EMAIL || 'thirushaun74@yahoo.com', // Use environment variable or fallback
        pass: process.env.YAHOO_APP_PASSWORD || 'tnqcbjvhjvuieevs' // Use environment variable or fallback
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
        from: process.env.YAHOO_EMAIL || 'thirushaun74@yahoo.com', // Use environment variable or fallback
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

        const appointments = JSON.parse(data).appointments;
        appointmentData.id = appointments.length + 1; // Assign a unique ID
        appointments.push(appointmentData);

        // Write updated appointments to db.json
        fs.writeFile(dbPath, JSON.stringify({ appointments }, null, 2), (err) => {
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

        const appointments = JSON.parse(data).appointments;
        res.status(200).json(appointments);
    });
});

// Endpoint to update appointment status
app.patch('/appointments/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const dbPath = path.join(__dirname, 'db.json');
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading db.json:', err);
            return res.status(500).send('Error reading database');
        }

        const { appointments } = JSON.parse(data);
        const appointment = appointments.find(app => app.id === parseInt(id));

        if (appointment) {
            appointment.status = status;

            fs.writeFile(dbPath, JSON.stringify({ appointments }, null, 2), (err) => {
                if (err) {
                    console.error('Error writing to db.json:', err);
                    return res.status(500).send('Error updating appointment');
                }

                res.status(200).send('Appointment updated successfully');
            });
        } else {
            res.status(404).send('Appointment not found');
        }
    });
});

// Endpoint to delete an appointment
app.delete('/appointments/:id', (req, res) => {
    const { id } = req.params;

    const dbPath = path.join(__dirname, 'db.json');
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading db.json:', err);
            return res.status(500).send('Error reading database');
        }

        let { appointments } = JSON.parse(data);
        const index = appointments.findIndex(app => app.id === parseInt(id));

        if (index !== -1) {
            appointments.splice(index, 1);

            fs.writeFile(dbPath, JSON.stringify({ appointments }, null, 2), (err) => {
                if (err) {
                    console.error('Error writing to db.json:', err);
                    return res.status(500).send('Error deleting appointment');
                }

                res.status(200).send('Appointment deleted successfully');
            });
        } else {
            res.status(404).send('Appointment not found');
        }
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
