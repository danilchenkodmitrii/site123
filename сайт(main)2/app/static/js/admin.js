import { getRooms, getSchedule, cancelBooking } from './calendar.js';
import { showNotification } from './notifications.js';
import { getAllUsers } from './auth.js';

const API_BASE = 'http://localhost:5000/api';

export function initializeAdmin() {
  // Admin-specific initialization
}

export async function showAdmin(rooms) {
  const roomsList = document.getElementById('roomsList');
  roomsList.innerHTML = '';
  rooms.forEach(room => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="item-info">
        <h4>${room.name}</h4>
        <p><img src="/money.png" alt="Цена" class="admin-icon"> ${room.price} ₽/ч • <img src="/peoples.png" alt="Вместимость" class="admin-icon"> ${room.capacity} человек • <img src="/gear.png" alt="Оборудование" class="admin-icon"> ${room.amenities || 'Стандартное'}</p>
      </div>
      <div class="item-actions">
        <button class="btn btn-secondary btn-small" onclick="app.editRoomPrice('${room.id}')">Редактировать цену</button>
        <button class="btn btn-danger btn-small" onclick="app.deleteRoom('${room.id}')">Удалить</button>
      </div>
    `;
    roomsList.appendChild(item);
  });

  const bookingsList = document.getElementById('bookingsList');
  bookingsList.innerHTML = '';
  const allBookings = [];
  for (const room of rooms) {
    const schedule = await getSchedule(room.id);
    schedule.forEach(b => {
      allBookings.push({...b, roomName: room.name});
    });
  }

  allBookings.sort((a, b) => new Date(a.date) - new Date(b.date));

  if (allBookings.length === 0) {
    bookingsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Нет бронирований</p>';
  } else {
    allBookings.forEach(booking => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <div class="item-info">
          <h4>${booking.roomName}</h4>
          <p style="margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">${booking.title}</p>
          <p><img src="/people.png" alt="Пользователь" class="admin-icon"> ${booking.userName} • <img src="/calendar.png" alt="Дата" class="admin-icon"> ${booking.date} • <img src="/clocks.png" alt="Время" class="admin-icon"> ${booking.startTime}-${booking.endTime}</p>
        </div>
        <button class="btn btn-danger btn-small" onclick="app.deleteBooking('${booking.id}')">Отменить</button>
      `;
      bookingsList.appendChild(item);
    });
  }
}

export async function loadAccessList() {
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

export async function addRoom() {
  const name = document.getElementById('roomName').value;
  const capacity = parseInt(document.getElementById('roomCapacity').value);
  const amenities = document.getElementById('roomAmenities').value;
  const price = parseFloat(document.getElementById('roomPrice')?.value || 0);

  if (!name || !capacity) {
    showNotification('Заполните название и вместимость', 'error');
    return false;
  }

  try {
    const response = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, capacity, amenities, price })
    });

    const room = await response.json();
    document.getElementById('roomName').value = '';
    document.getElementById('roomCapacity').value = '';
    document.getElementById('roomAmenities').value = '';
    if (document.getElementById('roomPrice')) document.getElementById('roomPrice').value = '';

    showNotification(`Комната \"${name}\" добавлена`, 'success');
    return true;
  } catch (error) {
    showNotification('Ошибка при добавлении комнаты', 'error');
    return false;
  }
}

export async function updateAccess() {
  const email = document.getElementById('userEmail').value;
  const role = document.getElementById('userRole').value;

  if (!email) {
    showNotification('Введите email пользователя', 'error');
    return;
  }

  try {
    const users = await (await fetch(`${API_BASE}/users`)).json();
    const user = users.find(u => u.email === email);

    if (!user) {
      showNotification('Пользователь не найден', 'error');
      return;
    }

    await fetch(`${API_BASE}/users/${user.id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });

    document.getElementById('userEmail').value = '';
    showNotification(`Права доступа для ${email} обновлены`, 'success');
  } catch (error) {
    showNotification('Ошибка при обновлении прав', 'error');
  }
}

function getRoleLabel(role) {
  const labels = {
    'user': 'Пользователь',
    'manager': 'Менеджер',
    'admin': 'Администратор'
  };
  return labels[role] || role;
}