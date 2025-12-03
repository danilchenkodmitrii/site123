import { getRooms, getSchedule } from './calendar.js';
import { showNotification } from './notifications.js';
import { getAllUsers } from './auth.js';

export function initializeAdmin() {
  // Admin-specific initialization
}

export function showAdmin(rooms) {
  // Rooms list
  const roomsList = document.getElementById('roomsList');
  roomsList.innerHTML = '';
  rooms.forEach(room => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="item-info">
        <h4>${room.name}</h4>
        <p>👥 ${room.capacity} человек • 🔧 ${room.amenities || 'Стандартное'}</p>
        <p>💰 Цена: ${room.price} ₽/ч</p>
      </div>
      <div class="item-actions">
        <button class="btn btn-secondary btn-small" onclick="app.editRoomPrice('${room.id}')">Редактировать цену</button>
        <button class="btn btn-danger btn-small" onclick="app.deleteRoom('${room.id}')">Удалить</button>
      </div>
    `;
    roomsList.appendChild(item);
  });

  // Bookings list
  const bookingsList = document.getElementById('bookingsList');
  bookingsList.innerHTML = '';
  const allBookings = [];
  rooms.forEach(room => {
    const schedule = getSchedule(room.id);
    schedule.forEach(b => {
      allBookings.push({...b, roomName: room.name});
    });
  });

  allBookings.sort((a, b) => new Date(a.date) - new Date(b.date));

  if (allBookings.length === 0) {
    bookingsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Нет бронирований</p>';
  } else {
    allBookings.forEach(booking => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <div class="item-info">
          <h4>${booking.title}</h4>
          <p>📍 ${booking.roomName} • 👤 ${booking.userName}</p>
          <p>📅 ${booking.date} • ⏰ ${booking.startTime}-${booking.endTime}</p>
        </div>
        <button class="btn btn-danger btn-small" onclick="app.deleteBooking('${booking.roomId}', '${booking.id}')">Отменить</button>
      `;
      bookingsList.appendChild(item);
    });
  }
}

export function loadAccessList() {
  const accessList = document.getElementById('accessList');
  const users = getAllUsers();

  accessList.innerHTML = '';
  users.forEach(user => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="item-info">
        <h4>${user.name}</h4>
        <p>${user.email} • Роль: <strong>${getRoleLabel(user.role)}</strong></p>
      </div>
      <button class="btn btn-secondary btn-small" onclick="window.app.updateUserRole('${user.id}')">Изменить</button>
    `;
    accessList.appendChild(item);
  });
}

export function addRoom() {
  const name = document.getElementById('roomName').value;
  const capacity = parseInt(document.getElementById('roomCapacity').value);
  const amenities = document.getElementById('roomAmenities').value;

  if (!name || !capacity) {
    showNotification('Заполните название и вместимость', 'error');
    return false;
  }

  const room = {
    id: 'room_' + Date.now(),
    name,
    capacity,
    amenities,
    createdAt: new Date().toISOString()
  };

  let rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
  rooms.push(room);
  localStorage.setItem('rooms', JSON.stringify(rooms));

  document.getElementById('roomName').value = '';
  document.getElementById('roomCapacity').value = '';
  document.getElementById('roomAmenities').value = '';

  showNotification(`Комната "${name}" добавлена`, 'success');
  return true;
}

export function updateAccess() {
  const email = document.getElementById('userEmail').value;
  const role = document.getElementById('userRole').value;

  if (!email) {
    showNotification('Введите email пользователя', 'error');
    return;
  }

  const users = JSON.parse(localStorage.getItem('users') || '[]');
  let user = users.find(u => u.email === email);

  if (!user) {
    user = { id: 'user_' + Date.now(), email, role };
    users.push(user);
  } else {
    user.role = role;
  }

  localStorage.setItem('users', JSON.stringify(users));
  document.getElementById('userEmail').value = '';

  showNotification(`Права доступа для ${email} обновлены`, 'success');
}

function getRoleLabel(role) {
  const labels = {
    'user': 'Пользователь',
    'manager': 'Менеджер',
    'admin': 'Администратор'
  };
  return labels[role] || role;
}