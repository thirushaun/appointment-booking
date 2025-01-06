const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // Serve static files

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
        // Filter appointments by date
        const filteredAppointments = appointments.filter(app => app.date === date);
        return res.status(200).json(filteredAppointments);
    }

    // Return all appointments if no date is provided
    res.status(200).json(appointments);
});

// Endpoint to handle appointment submissions
app.post('/appointments', (req, res) => {
    const { name, email, phone, service, date, time, status } = req.body;

    // Validate request body
    if (!name || !email || !phone || !service || !date || !time) {
        return res.status(400).send('Missing required fields');
    }

    // Read existing appointments
    const appointments = readAppointments();

    // Check for double booking
    const isDoubleBooked = appointments.some(app => app.date === date && app.time === time);
    if (isDoubleBooked) {
        return res.status(400).send('This time slot is already booked.');
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

    // Save the updated appointments to the file
    writeAppointments(appointments);

    // Log the appointment data (for debugging)
    console.log("New appointment added:", newAppointment);

    // Send a success response
    res.status(201).json({ message: 'Appointment saved successfully', data: newAppointment });
});

// Endpoint to mark an appointment as Done
app.patch('/appointments/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Read existing appointments
    const appointments = readAppointments();

    // Find the appointment by ID
    const appointment = appointments.find(app => app.id === parseInt(id));

    if (!appointment) {
        return res.status(404).send('Appointment not found');
    }

    // Update the appointment status
    appointment.status = status || "Done";

    // Save the updated appointments to the file
    writeAppointments(appointments);

    // Log the updated appointment (for debugging)
    console.log("Appointment updated:", appointment);

    // Send a success response
    res.status(200).json({ message: 'Appointment updated successfully', data: appointment });
});

// Endpoint to delete an appointment
app.delete('/appointments/:id', (req, res) => {
    const { id } = req.params;

    // Read existing appointments
    const appointments = readAppointments();

    // Find the appointment by ID
    const appointmentIndex = appointments.findIndex(app => app.id === parseInt(id));

    if (appointmentIndex === -1) {
        return res.status(404).send('Appointment not found');
    }

    // Remove the appointment from the list
    const deletedAppointment = appointments.splice(appointmentIndex, 1)[0];

    // Save the updated appointments to the file
    writeAppointments(appointments);

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
