const API_URL = "https://fathomless-fjord-27109-0008bf58a580.herokuapp.com"; // Updated to Heroku app URL

// Password check for Admin Dashboard
function checkPassword() {
    const password = prompt("Enter the password to access the Admin Dashboard:");
    if (password === "20061968") {
        window.location.href = "admin_dashboard.html"; // Redirect to Admin Dashboard
    } else {
        alert("Incorrect password. Access denied.");
    }
}

// Function to send emails
async function sendEmail(to, subject, text) {
    try {
        const response = await fetch(`${API_URL}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ to, subject, text })
        });

        if (response.ok) {
            console.log('Email sent successfully');
        } else {
            throw new Error('Failed to send email');
        }
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Handle form submission
document.getElementById('appointmentForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value; // Patient's email
    const phone = document.getElementById('phone').value;
    const service = document.getElementById('service').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    // Validate form fields
    if (!name || !email || !phone || !service || !date || !time) {
        alert("Please fill out all fields.");
        return;
    }

    // Create appointment data
    const appointmentData = {
        name,
        email,
        phone,
        service,
        date,
        time,
        status: "Pending"
    };

    try {
        // Save appointment to JSON Server
        const response = await fetch(`${API_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointmentData)
        });

        if (response.ok) {
            alert("Appointment booked successfully!");

            // Send email to patient
            const patientSubject = `Appointment Confirmation - ${service}`;
            const patientText = `Dear ${name},\n\nYour appointment for ${service} on ${date} at ${time} has been confirmed.\n\nThank you!`;
            await sendEmail(email, patientSubject, patientText);

            // Send email to doctor
            const doctorSubject = `New Appointment - ${service}`;
            const doctorText = `You have a new appointment:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nService: ${service}\nDate: ${date}\nTime: ${time}`;
            await sendEmail('thirushaun74@yahoo.com', doctorSubject, doctorText); // Doctor's email

            // Clear the form
            document.getElementById('appointmentForm').reset();
        } else {
            throw new Error("Failed to save appointment.");
        }
    } catch (error) {
        console.error("Error: ", error);
        alert("An error occurred. Please try again.");
    }
});
