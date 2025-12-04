import { getRooms, getSchedule } from './calendar.js';
import { showNotification } from './notifications.js';

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

export function showBooking() {
  document.getElementById('bookingDate').valueAsDate = new Date();
  updateTimeSlots();
}

export function updateTimeSlots() {
  const roomId = document.getElementById('roomSelect').value;
  const date = document.getElementById('bookingDate').value;

  if (!roomId || !date) {
    document.getElementById('availabilityGrid').innerHTML = '';
    return;
  }

  const room = rooms.find(r => r.id === roomId);
  const roomPrice = room ? room.price : 0;

  const schedule = getSchedule(roomId);
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
    const isBooked = dayBookings.some(b => 
      isTimeConflict(time, dayBookings)
    );
    
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

export function confirmBooking(currentUser) {
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
    id: Date.now(),
    roomId,
    date,
    startTime,
    endTime,
    title,
    participants: participants.split(',').map(p => p.trim()),
    userId: currentUser.id,
    userName: currentUser.name,
    createdAt: new Date().toISOString()
  };

  const schedule = getSchedule(roomId);
  schedule.push(booking);
  localStorage.setItem(`schedule_${roomId}`, JSON.stringify(schedule));

  showNotification(`Переговорная "${rooms.find(r => r.id === roomId).name}" успешно забронирована на ${date} с ${startTime} до ${endTime}`, 'success');

  document.getElementById('meetingTitle').value = '';
  document.getElementById('participants').value = '';
  document.getElementById('startTime').value = '';
  document.getElementById('endTime').value = '';
  
  updateTimeSlots();
}

