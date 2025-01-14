const API_URL = "http://localhost:5001"; // Replace with your Heroku URL if deployed

// Function to handle form submission
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
        // Save appointment to backend
        const response = await fetch(`${API_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointmentData)
        });

        if (response.ok) {
            alert("Appointment booked successfully!");
            document.getElementById('appointmentForm').reset();
        } else {
            const errorData = await response.json();
            console.error("Failed to save appointment:", errorData);
            alert("An error occurred. Please try again.");
        }
    } catch (error) {
        console.error("Error: ", error);
        alert("An error occurred. Please try again.");
    }
});

// Function to update time slots based on selected date
async function updateTimeSlots() {
    const dateInput = document.getElementById('date');
    const timeSelect = document.getElementById('time');

    const selectedDate = dateInput.value;

    // Fetch booked slots for the selected date
    const bookedSlots = await fetchBookedSlots(selectedDate);

    // Generate and populate time slots
    timeSelect.innerHTML = generateTimeSlots(bookedSlots);
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

// Add event listener to date input
document.getElementById('date').addEventListener('change', updateTimeSlots);

// Initialize time slots when the page loads
window.onload = () => {
    updateTimeSlots();
};
