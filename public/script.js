const API_URL = ""; // Use relative URL for Heroku
const CALENDARIFIC_API_KEY = "bFoaCrr86CwlD5T2pBf3GGabQFGR5NBx"; // Your actual API key

// Password check for Admin Dashboard
function checkPassword() {
    const password = prompt("Enter the password to access the Admin Dashboard:");
    if (password === "20061968") {
        window.location.href = "admin_dashboard.html"; // Redirect to Admin Dashboard
    } else {
        alert("Incorrect password. Access denied.");
    }
}

// Function to generate time slots (9:00 AM to 5:00 PM, 15-minute intervals)
function generateTimeSlots(bookedSlots = []) {
    const timeSlots = [];
    const startTime = 9 * 60; // 9:00 AM in minutes
    const endTime = 17 * 60; // 5:00 PM in minutes
    const interval = 15; // 15-minute intervals

    for (let minutes = startTime; minutes < endTime; minutes += interval) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

        // Check if the time slot is already booked
        const isBooked = bookedSlots.includes(timeString);

        // Add the time slot to the dropdown
        timeSlots.push(`<option value="${timeString}" ${isBooked ? 'disabled' : ''}>${timeString}</option>`);
    }

    return timeSlots.join('');
}

// Function to fetch booked time slots for a specific date
async function fetchBookedSlots(date) {
    try {
        const response = await fetch(`${API_URL}/appointments?date=${date}`);
        const appointments = await response.json();
        return appointments.map(app => app.time); // Return array of booked times
    } catch (error) {
        console.error("Error fetching booked slots: ", error);
        return [];
    }
}

// Function to fetch public holidays for Malaysia for a specific year
async function fetchPublicHolidays(year) {
    try {
        const response = await fetch(
            `https://calendarific.com/api/v2/holidays?api_key=${CALENDARIFIC_API_KEY}&country=MY&year=${year}`
        );
        const data = await response.json();
        if (data.response && data.response.holidays) {
            return data.response.holidays.map(holiday => holiday.date.iso);
        }
        return [];
    } catch (error) {
        console.error("Error fetching public holidays:", error);
        return [];
    }
}

// Function to get public holidays for the selected year
async function getPublicHolidays(selectedDate) {
    const selectedYear = new Date(selectedDate).getFullYear();
    const cachedHolidays = localStorage.getItem(`publicHolidays_${selectedYear}`);

    if (cachedHolidays) {
        return JSON.parse(cachedHolidays); // Use cached holidays
    } else {
        const holidays = await fetchPublicHolidays(selectedYear);
        localStorage.setItem(`publicHolidays_${selectedYear}`, JSON.stringify(holidays)); // Cache holidays
        return holidays;
    }
}

// Function to validate the selected date (must be within the next 3 months and not a public holiday)
async function validateDate(selectedDate) {
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);

    const selectedDateObj = new Date(selectedDate);

    // Check if the selected date is in the past
    if (selectedDateObj < today) {
        alert("Appointments cannot be booked for past dates. Please select a valid date.");
        return false;
    }

    // Check if the selected date is more than 3 months ahead
    if (selectedDateObj > threeMonthsLater) {
        alert("For better scheduling, appointments can only be booked up to 3 months in advance. Please select a date within the next 3 months.");
        return false;
    }

    // Check if the selected date is a public holiday
    const publicHolidays = await getPublicHolidays(selectedDate);
    if (publicHolidays.includes(selectedDate)) {
        alert("Appointments are not available on public holidays. Please select another date.");
        return false;
    }

    return true;
}

// Update the form submission logic
document.getElementById('appointmentForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const service = document.getElementById('service').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    // Validate form fields
    if (!name || !email || !phone || !service || !date || !time) {
        alert("Please fill out all fields.");
        return;
    }

    // Validate phone number
    if (!validatePhoneNumber(phone)) {
        return; // Stop if the phone number is invalid
    }

    // Validate the selected date
    if (!(await validateDate(date))) {
        return; // Stop if the date is invalid
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

    console.log("Sending appointment data:", appointmentData); // Debugging log

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

            // Update time slots after booking
            updateTimeSlots();
        } else {
            const errorData = await response.json(); // Parse error response
            console.error("Failed to save appointment:", errorData);
            throw new Error("Failed to save appointment.");
        }
    } catch (error) {
        console.error("Error: ", error);
        alert("An error occurred. Please try again.");
    }
});

// Function to validate phone number (must include country code)
function validatePhoneNumber(phone) {
    const phoneRegex = /^\+\d{10,15}$/; // Example: +60167051852
    if (!phoneRegex.test(phone)) {
        alert("Please enter a valid phone number with a country code (e.g., +60167051852).");
        return false;
    }
    return true;
}

// Function to update time slots based on selected date
async function updateTimeSlots() {
    const dateInput = document.getElementById('date');
    const timeSelect = document.getElementById('time');

    const selectedDate = dateInput.value;

    // Validate day of the week (Monday to Saturday)
    const dateObj = new Date(selectedDate);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    if (dayOfWeek === 0) { // Sunday
        alert("Appointments are not available on Sundays. Please select another date.");
        dateInput.value = ''; // Clear the date input
        timeSelect.innerHTML = '<option value="">Select a valid date first</option>';
        return;
    }

    // Fetch booked slots for the selected date
    const bookedSlots = await fetchBookedSlots(selectedDate);

    // Generate and populate time slots
    timeSelect.innerHTML = generateTimeSlots(bookedSlots);

    // Debugging: Log booked slots and generated slots
    console.log("Booked Slots:", bookedSlots);
    console.log("Generated Slots:", timeSelect.innerHTML);
}

// Add event listener to date input
document.getElementById('date').addEventListener('change', updateTimeSlots);

// Initialize time slots when the page loads
window.onload = () => {
    updateTimeSlots();
    document.getElementById('holidayMessage').textContent = "Note: Appointments are not available on public holidays.";
};

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
