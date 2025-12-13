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
    option.textContent = `${room.name} (${room.capacity} чел.)`;
    select.appendChild(option);
  });
}

export async function confirmBooking() {
  const currentUser = JSON.parse(localStorage.getItem('soveshaika_user'));
  
  if (!currentUser) {
    showNotification('Необходимо войти в систему', 'error');
    window.app.switchView('auth');
    return;
  }

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

  try {
    const response = await fetch('/api/bookings/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: roomId,
        user_id: currentUser.id,
        date: date,
        start_time: startTime,
        end_time: endTime,
        title: title,
        participants: participants || ''
      })
    });

    if (response.ok) {
      const booking = await response.json();
      const roomName = rooms.find(r => r.id === roomId)?.name || 'Переговорная';
      showNotification(`"${roomName}" успешно забронирована на ${date} с ${startTime} до ${endTime}`, 'success');

      // Очищаем форму
      document.getElementById('meetingTitle').value = '';
      document.getElementById('participants').value = '';
      
      // Переключаемся на расписание
      window.app.switchView('dashboard');
    } else {
      const error = await response.json();
      showNotification(error.detail || 'Ошибка бронирования', 'error');
    }
  } catch (error) {
    showNotification('Ошибка сети при бронировании', 'error');
  }
}