import { getRooms, getSchedule, addBooking } from './calendar.js';
import { showNotification } from './notifications.js';

const API_BASE = 'http://localhost:5000/api';

let rooms = [];

export function initializeBooking(allRooms) {
  rooms = allRooms;
}

export function populateRoomSelects() {
  const select = document.getElementById('roomSelect');
  select.innerHTML = '<option value="">-- Выберите комнату --</option>';
  rooms.forEach(room => {
    const option = document.createElement('option');
    option.value = room.id;
    option.textContent = room.name;
    select.appendChild(option);
  });
}

export async function showBooking() {
  document.getElementById('bookingDate').valueAsDate = new Date();
  await updateTimeSlots();
}

export async function updateTimeSlots() {
  const roomId = document.getElementById('roomSelect').value;
  const date = document.getElementById('bookingDate').value;

  if (!roomId || !date) {
    document.getElementById('availabilityGrid').innerHTML = '';
    return;
  }

  const schedule = await getSchedule(roomId);
  const dayBookings = schedule.filter(b => b.date === date);

  const startSelect = document.getElementById('startTime');
  const endSelect = document.getElementById('endTime');

  startSelect.innerHTML = '<option value="">-- Выберите время --</option>';
  endSelect.innerHTML = '<option value="">-- Выберите время --</option>';

  const hours = Array.from({length: 17}, (_, i) => {
    const hour = 8 + i;
    return `${String(hour).padStart(2, '0')}:00`;
  });

  hours.forEach(time => {
    const isBooked = dayBookings.some(b => isTimeConflict(time, dayBookings));

    const option1 = document.createElement('option');
    option1.value = time;
    option1.textContent = time;
    if (!isBooked) startSelect.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = time;
    option2.textContent = time;
    if (!isBooked) endSelect.appendChild(option2);
  });
}

function isTimeConflict(time, bookings) {
  return bookings.some(b => time >= b.startTime && time < b.endTime);
}

export async function confirmBooking(currentUser) {
  const roomId = document.getElementById('roomSelect').value;
  const date = document.getElementById('bookingDate').value;
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;
  const title = document.getElementById('meetingTitle').value;
  const participants = document.getElementById('participants').value;

  if (!roomId || !date || !startTime || !endTime || !title) {
    showNotification('Заполните все обязательные поля', 'error');
    return;
  }

  if (startTime >= endTime) {
    showNotification('Время окончания должно быть позже времени начала', 'error');
    return;
  }

  const booking = {
    roomId,
    userId: currentUser.id,
    date,
    startTime,
    endTime,
    title,
    participants: participants.split(',').map(p => p.trim()).filter(p => p)
  };

  try {
    const response = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    });

    if (!response.ok) {
      showNotification('Время уже занято', 'error');
      return;
    }

    const roomName = rooms.find(r => r.id === roomId).name;
    showNotification(`Переговорная "${roomName}" успешно забронирована`, 'success');

    document.getElementById('meetingTitle').value = '';
    document.getElementById('participants').value = '';
    document.getElementById('startTime').value = '';
    document.getElementById('endTime').value = '';

    await updateTimeSlots();
  } catch (error) {
    showNotification('Ошибка при бронировании', 'error');
  }
}