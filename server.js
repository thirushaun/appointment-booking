const express = require('express');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Nodemailer configuration for Gmail using OAuth2
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
    '980640863174-1jitdct04ceo06820prm4bi0h544mu5j.apps.googleusercontent.com', // Your Client ID
    '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', // Your Client Secret
    'https://developers.google.com' // Redirect URI (without /oauthplayground)
);

oauth2Client.setCredentials({
    refresh_token: '1//04AeCCBqtqWF0CgYIARAAGAQSNwF-L9IrKg8Kn5J7Br0j6smTJiIEL7K6j2NMKBGKHQKncjnO8MfSd1vnXrnFOknHeLijiQ4fI9' // Your Refresh Token
});

const accessToken = oauth2Client.getAccessToken();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: 'medivironaustin68@gmail.com', // Your Gmail address
        clientId: '980640863174-1jitdct04ceo06820prm4bi0h544mu5j.apps.googleusercontent.com', // Your Client ID
        clientSecret: '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', // Your Client Secret
        refreshToken: '1//04AeCCBqtqWF0CgYIARAAGAQSNwF-L9IrKg8Kn5J7Br0j6smTJiIEL7K6j2NMKBGKHQKncjnO8MfSd1vnXrnFOknHeLijiQ4fI9', // Your Refresh Token
        accessToken: accessToken, // Automatically generated
    },
});

// File path for storing appointments
const APPOINTMENTS_FILE = 'db.json';

// Helper function to read appointments from the file
function readAppointments() {
    if (!fs.existsSync(APPOINTMENTS_FILE)) {
        fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify({ appointments: [] }));
    }
    const data = fs.readFileSync(APPOINTMENTS_FILE);
    return JSON.parse(data).appointments;
}

// Helper function to write appointments to the file
function writeAppointments(appointments) {
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify({ appointments }, null, 2));
}

// Endpoint to fetch all appointments
app.get('/appointments', (req, res) => {
    const { date } = req.query;
    const appointments = readAppointments();

    if (date) {
        const filteredAppointments = appointments.filter(app => app.date === date);
        return res.status(200).json(filteredAppointments);
    }

    res.status(200).json(appointments);
});

// Endpoint to handle appointment submissions
app.post('/appointments', (req, res) => {
    const { name, email, phone, service, date, time, status } = req.body;

    if (!name || !email || !phone || !service || !date || !time) {
        return res.status(400).send('Missing required fields');
    }

    const appointments = readAppointments();
    const isDoubleBooked = appointments.some(app => app.date === date && app.time === time);

    if (isDoubleBooked) {
        return res.status(400).send('This time slot is already booked.');
    }

    const newAppointment = {
        id: appointments.length + 1,
        name,
        email,
        phone,
        service,
        date,
        time,
        status: status || "Pending",
    };

    appointments.push(newAppointment);
    writeAppointments(appointments);

    res.status(201).json({ message: 'Appointment saved successfully', data: newAppointment });
});

// Endpoint to mark an appointment as Done
app.patch('/appointments/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const appointments = readAppointments();
    const appointment = appointments.find(app => app.id === parseInt(id));

    if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
    }

    appointment.status = status || "Done";
    writeAppointments(appointments);

    res.status(200).json({ message: 'Appointment updated successfully', data: appointment });
});

// Endpoint to delete an appointment
app.delete('/appointments/:id', (req, res) => {
    const { id } = req.params;

    const appointments = readAppointments();
    const appointmentIndex = appointments.findIndex(app => app.id === parseInt(id));

    if (appointmentIndex === -1) {
        return res.status(404).json({ error: 'Appointment not found' });
    }

    const deletedAppointment = appointments.splice(appointmentIndex, 1)[0];
    writeAppointments(appointments);

    res.status(200).json({ message: 'Appointment deleted successfully', data: deletedAppointment });
});

// Endpoint to send emails
app.post('/send-email', async (req, res) => {
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
        return res.status(400).json({ error: 'Missing required fields: to, subject, text' });
    }

    const mailOptions = {
        from: 'medivironaustin68@gmail.com', // Your Gmail address
        to,
        subject,
        text,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Error sending email' });
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
