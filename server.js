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

    // Send email to patient
    const patientSubject = `Appointment Confirmation - ${service}`;
    const patientText = `Dear ${name},\n\nYour appointment for ${service} on ${date} at ${time} has been confirmed.\n\nThank you!`;
    transporter.sendMail({
        from: 'medivironaustin68@gmail.com',
        to: email,
        subject: patientSubject,
        text: patientText,
    }, (error, info) => {
        if (error) {
            console.error('Error sending email to patient:', error);
        } else {
            console.log('Email sent to patient:', info.response);
        }
    });

    // Send email to clinic
    const clinicSubject = `New Appointment - ${service}`;
    const clinicText = `You have a new appointment:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nService: ${service}\nDate: ${date}\nTime: ${time}`;
    transporter.sendMail({
        from: 'medivironaustin68@gmail.com',
        to: 'medivironaustin68@gmail.com', // Clinic's email
        subject: clinicSubject,
        text: clinicText,
    }, (error, info) => {
        if (error) {
            console.error('Error sending email to clinic:', error);
        } else {
            console.log('Email sent to clinic:', info.response);
        }
    });

    res.status(201).json({ message: 'Appointment saved successfully', data: newAppointment });
});

// Endpoint to mark an appointment as Done
app.patch('/appointments/:id', (req, res) => {
    const { id } =
