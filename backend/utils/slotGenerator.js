function toAMPM(time24) {
  let [hour, minute] = time24.split(":");
  hour = parseInt(hour);

  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  hour = hour ? hour : 12;

  return `${hour}:${minute} ${ampm}`;
}

function generateTimeSlots(startTime, endTime, slotDuration) {
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
    const slotStart = toTime(start);
    const slotEnd = toTime(start + slotDuration);

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      display: `${toAMPM(slotStart)} - ${toAMPM(slotEnd)}`
    });

    start += slotDuration;
  }

  return slots;
}

module.exports = generateTimeSlots;