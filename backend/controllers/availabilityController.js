import Professional from "../models/professionalModel.js";
import Appointment from "../models/Appointment.js";
const toAMPM = (time24) => {
  let [hour, minute] = time24.split(":");
  hour = parseInt(hour);

  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  hour = hour ? hour : 12;

  return `${hour}:${minute} ${ampm}`;
};
const getDayName = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
  });
};

const generateSlots = (date, startTime, endTime, slotDuration) => {
  const slots = [];

  const toMinutes = (time) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const toTime = (mins) => {
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    return `${h}:${m}`;
  };

  let start = toMinutes(startTime);
  const end = toMinutes(endTime);

  while (start + slotDuration <= end) {
    slots.push(toTime(start));
    start += slotDuration;
  }

  return slots;
};

export const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "doctorId and date are required",
      });
    }

    const professional = await Professional.findOne({ pID: doctorId });
    console.log("Doctor found:", professional?.pID);
console.log("Availability:", professional?.availability);
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      });
    }

    const dayName = getDayName(date);
    console.log("Date day:", dayName);

    const availability = professional.availability?.find(
      (item) => item.day === dayName
    );

    if (!availability) {
      return res.status(200).json({
        success: true,
        slots: [],
        message: "No availability for this day",
      });
    }

    const allSlots = generateSlots(
      date,
      availability.startTime,
      availability.endTime,
      availability.slotDuration || 30
    );

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const bookedAppointments = await Appointment.find({
      doctorId,
      appointmentDate: selectedDate,
      status: { $ne: "cancelled" },
    }).select("appointmentTime");

    const bookedTimes = bookedAppointments.map((item) => item.appointmentTime);

    const availableSlots = allSlots.map((slot) => ({
      time24: slot,
      time12: toAMPM(slot),
      booked: bookedTimes.includes(slot),
    }));

    return res.status(200).json({
      success: true,
      doctorId,
      date,
      day: dayName,
      slots: availableSlots,
    });
  } catch (error) {
    console.error("Error getting available slots:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting available slots",
      error: error.message,
    });
  }
};