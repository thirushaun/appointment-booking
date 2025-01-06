const API_URL = ""; // Use relative URL for Heroku

// Fetch all appointments
async function fetchAppointments() {
    try {
        const response = await fetch(`${API_URL}/appointments`);
        const appointments = await response.json();
        const appointmentsBody = document.getElementById('appointmentsBody');

        // Clear existing rows
        appointmentsBody.innerHTML = "";

        // Add each appointment to the table
        appointments.forEach(appointment => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${appointment.name}</td>
                <td>${appointment.email}</td>
                <td>${appointment.phone}</td>
                <td>${appointment.service}</td>
                <td>${appointment.date}</td>
                <td>${appointment.time}</td>
                <td>${appointment.status || "Pending"}</td>
                <td>
                    <button onclick="markAsDone(${appointment.id})">Mark as Done</button>
                    <button onclick="deleteAppointment(${appointment.id})" style="background-color: #ff4d4d; color: white;"><i class="fas fa-trash"></i></button>
                </td>
            `;

            appointmentsBody.appendChild(row);
        });

        // Render the graph with the default time period (weekly)
        updateGraph(appointments);
    } catch (error) {
        console.error("Error fetching appointments: ", error);
    }
}

// Update the graph based on the selected time period
function updateGraph(appointments) {
    const timePeriod = document.getElementById('timePeriod').value;
    const processedData = processAppointmentsForGraph(appointments, timePeriod);

    // Get the canvas element
    const ctx = document.getElementById('weeklyStatsChart').getContext('2d');

    // Destroy the existing chart if it exists
    if (window.myChart) {
        window.myChart.destroy();
    }

    // Create the chart
    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: processedData.labels, // Time periods (e.g., weeks, months, years)
            datasets: [
                {
                    label: 'Done',
                    data: processedData.done,
                    borderColor: 'green',
                    fill: false
                },
                {
                    label: 'Pending',
                    data: processedData.pending,
                    borderColor: 'orange',
                    fill: false
                },
                {
                    label: 'Deleted',
                    data: processedData.deleted,
                    borderColor: 'red',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Patients'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: timePeriod === 'week' ? 'Weeks' : timePeriod === 'month' ? 'Months' : 'Years'
                    }
                }
            }
        }
    });
}

// Process appointments for the graph based on the selected time period
function processAppointmentsForGraph(appointments, timePeriod) {
    const stats = {
        labels: [], // Time periods (e.g., weeks, months, years)
        done: [],   // Number of Done appointments per time period
        pending: [], // Number of Pending appointments per time period
        deleted: []  // Number of Deleted appointments per time period
    };

    // Group appointments by the selected time period
    const periodMap = new Map();

    appointments.forEach(appointment => {
        const date = new Date(appointment.date);
        let periodKey;

        if (timePeriod === 'week') {
            periodKey = getWeekNumber(date);
        } else if (timePeriod === 'month') {
            periodKey = date.getMonth() + 1; // Month number (1-12)
        } else if (timePeriod === 'year') {
            periodKey = date.getFullYear(); // Year (e.g., 2023)
        }

        if (!periodMap.has(periodKey)) {
            periodMap.set(periodKey, { done: 0, pending: 0, deleted: 0 });
        }

        const periodData = periodMap.get(periodKey);

        if (appointment.status === "Done") {
            periodData.done++;
        } else if (appointment.status === "Pending") {
            periodData.pending++;
        } else if (appointment.status === "Deleted") {
            periodData.deleted++;
        }
    });

    // Convert the map to arrays for Chart.js
    periodMap.forEach((value, key) => {
        stats.labels.push(
            timePeriod === 'week' ? `Week ${key}` :
            timePeriod === 'month' ? `Month ${key}` :
            `Year ${key}`
        );
        stats.done.push(value.done);
        stats.pending.push(value.pending);
        stats.deleted.push(value.deleted);
    });

    return stats;
}

// Helper function to get the week number of a date
function getWeekNumber(date) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - startOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
}

// Mark an appointment as Done
async function markAsDone(id) {
    try {
        const response = await fetch(`${API_URL}/appointments/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: "Done" })
        });

        if (response.ok) {
            alert("Appointment marked as Done.");
            fetchAppointments(); // Refresh the table and graph
        } else {
            throw new Error("Failed to mark appointment as Done.");
        }
    } catch (error) {
        console.error("Error: ", error);
    }
}

// Delete an appointment
async function deleteAppointment(id) {
    if (confirm("Are you sure you want to delete this appointment?")) {
        try {
            const response = await fetch(`${API_URL}/appointments/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert("Appointment deleted.");
                fetchAppointments(); // Refresh the table and graph
            } else {
                throw new Error("Failed to delete appointment.");
            }
        } catch (error) {
            console.error("Error: ", error);
        }
    }
}

// Load appointments when the page loads
window.onload = fetchAppointments;
