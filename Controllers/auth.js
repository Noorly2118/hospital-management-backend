import User from "../models/User.js";
import Appointment from "../models/appointment.js";
import Lab from "../models/lab.js";
import Payment from "../models/payment.js";

export const getAdminStats = async (req, res) => {
  try {
    const users = await User.find();
    const appointments = await Appointment.find();
    const labs = await Lab.find();
    const payments = await Payment.find();

    // Users
    const totalUsers = users.length;
    const pendingUsers = users.filter(u => u.status === "pending").length;
    const doctors = users.filter(u => u.role === "doctor").length;

    // Appointments
    const totalAppointments = appointments.length;
    const pendingAppointments = appointments.filter(a => a.status === "pending").length;

    // Labs
    const totalLabTests = labs.length;
    const pendingLabTests = labs.filter(l => l.status === "pending").length;

    // Payments
    const totalPayments = payments.length;
    const pendingPayments = payments.filter(p => p.status === "pending").length;

    // Charts data
    const consultationsByDay = {};
    appointments.forEach(a => {
      const day = a.date ? new Date(a.date).toLocaleDateString() : "Unknown";
      consultationsByDay[day] = (consultationsByDay[day] || 0) + 1;
    });

    const labStatus = { pending: 0, completed: 0, rejected: 0 };
    labs.forEach(l => labStatus[l.status] = (labStatus[l.status] || 0) + 1);

    const rolesCount = {};
    users.forEach(u => rolesCount[u.role || "unknown"] = (rolesCount[u.role || "unknown"] || 0) + 1);

    const paymentStatus = { pending: 0, completed: 0, rejected: 0 };
    payments.forEach(p => paymentStatus[p.status] = (paymentStatus[p.status] || 0) + 1);

    res.json({
      stats: {
        users: totalUsers,
        pendingUsers,
        doctors,
        appointments: totalAppointments,
        pendingAppointments,
        labTests: totalLabTests,
        pendingLabTests,
        payments: totalPayments,
        pendingPayments
      },
      charts: {
        consultations: { labels: Object.keys(consultationsByDay), data: Object.values(consultationsByDay) },
        labTests: labStatus,
        userRoles: rolesCount,
        payments: paymentStatus
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
