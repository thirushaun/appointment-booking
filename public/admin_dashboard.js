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
        updateGraph();
    } catch (error) {
        console.error("Error fetching appointments: ", error);
    }
}

// Update the graph based on the selected time period
async function updateGraph() {
    try {
        // Fetch appointments if not provided
        const response = await fetch(`${API_URL}/appointments`);
        const appointments = await response.json();

        // Get the selected time period
        const timePeriod = document.getElementById('timePeriod').value;

        // Process data for the graph
        const processedData = processAppointmentsForGraph(appointments, timePeriod);

        // Get the canvas element
        const ctx = document.getElementById('weeklyStatsChart').getContext('2d');

        // Destroy the existing chart if it exists
        if (window.myChart) {
            window.myChart.destroy();
        }

        // Create the chart
        window.myChart = new Chart(ctx, {
            type: 'pie', // Change to pie chart
            data: {
                labels: processedData.labels, // Categories (Done, Pending, Deleted)
                datasets: [
                    {
                        label: 'Number of Patients',
                        data: processedData.counts, // Counts for each category
                        backgroundColor: ['green', 'orange', 'red'], // Colors for each category
                        borderColor: 'white', // Border color for pie sections
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allow the chart to resize freely
                plugins: {
                    tooltip: {
                        enabled: false // Disable tooltips since numbers are displayed inside the pie
                    },
                    datalabels: {
                        color: 'white', // Text color for labels inside the pie chart
                        font: {
                            size: 14, // Font size for the numbers
                            weight: 'bold' // Make the numbers bold
                        },
                        formatter: (value) => {
                            return value; // Display the count inside each pie section
                        }
                    }
                }
            },
            plugins: [ChartDataLabels] // Add the datalabels plugin
        });
    } catch (error) {
        console.error("Error updating graph: ", error);
    }
}

// Process appointments for the graph based on the selected time period
function processAppointmentsForGraph(appointments, timePeriod) {
    const stats = {
        labels: ['Done', 'Pending', 'Deleted'], // Categories
        counts: [0, 0, 0] // Counts for each category
    };

    // Count appointments by status
    appointments.forEach(appointment => {
        if (appointment.status === "Done") {
            stats.counts[0]++;
        } else if (appointment.status === "Pending") {
            stats.counts[1]++;
        } else if (appointment.status === "Deleted") {
            stats.counts[2]++;
        }
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
