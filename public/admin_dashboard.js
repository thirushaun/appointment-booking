const API_URL = window.location.origin; // Use the current origin (e.g., http://localhost:5001)

// Fetch all appointments
async function fetchAppointments() {
  try {
    const response = await fetch(`${API_URL}/appointments`);
    const appointments = await response.json();
    const appointmentsBody = document.getElementById('appointmentsBody');
    appointmentsBody.innerHTML = "";

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

    updateGraph();
  } catch (error) {
    console.error("Error fetching appointments: ", error);
  }
}

// Mark an appointment as Done
async function markAsDone(id) {
  try {
    const response = await fetch(`${API_URL}/appointments/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: "Done" }), // Send the new status
    });

    if (response.ok) {
      alert("Appointment marked as Done.");
      fetchAppointments(); // Refresh the table
    } else {
      throw new Error("Failed to mark appointment as Done.");
    }
  } catch (error) {
    console.error("Error: ", error);
    alert("An error occurred. Please try again.");
  }
}

// Delete an appointment
async function deleteAppointment(id) {
  if (confirm("Are you sure you want to delete this appointment?")) {
    try {
      const response = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert("Appointment deleted.");
        fetchAppointments(); // Refresh the table
      } else {
        throw new Error("Failed to delete appointment.");
      }
    } catch (error) {
      console.error("Error: ", error);
      alert("An error occurred. Please try again.");
    }
  }
}

// Load appointments when the page loads
window.onload = fetchAppointments;
