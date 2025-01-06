const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5001; // Use port 5001

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); // Enable CORS for all routes

// Configure Nodemailer for Yahoo
const transporter = nodemailer.createTransport({
    service: 'yahoo',
    auth: {
        user: 'thirushaun74@yahoo.com', // Your Yahoo email
        pass: 'tnqcbjvhjvuieevs' // Your Yahoo App Password
    }
});

// In-memory storage for appointments (replace this with a database in production)
let appointments = [
    {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        phone: "+123456789",
        service: "Consultation",
        date: "2025-01-05",
        time: "10:00 AM",
        status: "Pending"
    },
    {
        id: 2,
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "+987654321",
        service: "X-Ray",
        date: "2025-01-06",
        time: "11:00 AM",
        status: "Done"
    }
];

// Endpoint to fetch all appointments
app.get('/appointments', (req, res) => {
    res.status(200).json(appointments);
});

// Endpoint to handle appointment submissions
app.post('/appointments', (req, res) => {
    const { name, email, phone, service, date, time, status } = req.body;

    // Validate request body
    if (!name || !email || !phone || !service || !date || !time) {
        return res.status(400).send('Missing required fields');
    }

    // Create a new appointment
    const newAppointment = {
        id: appointments.length + 1, // Generate a new ID
        name,
        email,
        phone,
        service,
        date,
        time,
        status: status || "Pending" // Default status is "Pending"
    };

    // Add the new appointment to the list
    appointments.push(newAppointment);

    // Log the appointment data (for debugging)
    console.log("New appointment added:", newAppointment);

    // Send a success response
    res.status(201).json({ message: 'Appointment saved successfully', data: newAppointment });
});

// Endpoint to mark an appointment as Done
app.patch('/appointments/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Find the appointment by ID
    const appointment = appointments.find(app => app.id === parseInt(id));

    if (!appointment) {
        return res.status(404).send('Appointment not found');
    }

    // Update the appointment status
    appointment.status = status || "Done";

    // Log the updated appointment (for debugging)
    console.log("Appointment updated:", appointment);

    // Send a success response
    res.status(200).json({ message: 'Appointment updated successfully', data: appointment });
});

// Endpoint to delete an appointment
app.delete('/appointments/:id', (req, res) => {
    const { id } = req.params;

    // Find the appointment by ID
    const appointmentIndex = appointments.findIndex(app => app.id === parseInt(id));

    if (appointmentIndex === -1) {
        return res.status(404).send('Appointment not found');
    }

    // Remove the appointment from the list
    const deletedAppointment = appointments.splice(appointmentIndex, 1);

    // Log the deleted appointment (for debugging)
    console.log("Appointment deleted:", deletedAppointment);

    // Send a success response
    res.status(200).json({ message: 'Appointment deleted successfully', data: deletedAppointment });
});

// Endpoint to send emails
app.post('/send-email', async (req, res) => {
    const { to, subject, text } = req.body;

    // Validate request body
    if (!to || !subject || !text) {
        return res.status(400).send('Missing required fields: to, subject, text');
    }

    const mailOptions = {
        from: 'thirushaun74@yahoo.com', // Your Yahoo email
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
