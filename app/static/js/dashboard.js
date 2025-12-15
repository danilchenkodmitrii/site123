import { getRooms, getSchedule } from './calendar.js';

let rooms = [];

export function initializeDashboard(allRooms) {
  rooms = allRooms;
}

export async function showDashboard() {
  const grid = document.getElementById('roomsGrid');
  grid.innerHTML = '';
  await displayRooms(rooms);
}

export async function displayRooms(roomsToDisplay) {
  const grid = document.getElementById('roomsGrid');
  grid.innerHTML = '';

  for (const room of roomsToDisplay) {
    const schedule = await getSchedule(room.id);
    const card = document.createElement('div');
    card.className = 'room-card';

    const today = new Date().toISOString().split('T')[0];
    const todayBookings = schedule.filter(b => b.date === today);
    const nextBooking = todayBookings[0];

    card.innerHTML = `
      <h3>${room.name}</h3>
      <div class="room-info">
        <div class="room-info-item">
          <span><img src="/money.png" alt="Цена" class="room-icon"> Цена:</span>
          <strong>${room.price} ₽/ч</strong>
        </div>
        <div class="room-info-item">
          <span><img src="/peoples.png" alt="Вместимость" class="room-icon"> Вместимость:</span>
          <strong>${room.capacity} человек</strong>
        </div>
        <div class="room-info-item">
          <span><img src="/gear.png" alt="Оборудование" class="room-icon"> Оборудование:</span>
          <strong>${room.amenities || 'Стандартное'}</strong>
        </div>
        <div class="room-info-item">
          <span><img src="/calendar.png" alt="Сегодня" class="room-icon"> Сегодня:</span>
          <strong>${todayBookings.length} встреч${todayBookings.length !== 1 ? ' (и)' : ''}</strong>
        </div>
        ${nextBooking ? `
          <div class="room-info-item">
            <span><img src="/clocks.png" alt="Следующая встреча" class="room-icon"> Следующая встреча:</span>
            <strong>${nextBooking.title} (${nextBooking.startTime})</strong>
          </div>
        ` : '<div class="room-info-item"><span style="color: var(--success);">✓ Свободна весь день</span></div>'}
      </div>
      <div class="schedule-slots">
        <strong style="display: block; margin-bottom: 0.5rem;">Слоты сегодня:</strong>
        ${todayBookings.length > 0 ? 
          todayBookings.slice(0, 3).map(b => 
            `<span class="slot booked">${b.startTime}-${b.endTime}</span>`
          ).join('') : 
          '<span class="slot available">Свободно весь день</span>'
        }
      </div>
    `;

    card.addEventListener('click', () => {
      document.getElementById('roomSelect').value = room.id;
      window.app.switchView('booking');
    });

    grid.appendChild(card);
  }
}

export async function applyFilters() {
  const statusFilters = Array.from(document.querySelectorAll('input[name="status"]:checked')).map(cb => cb.value);
  const capacityFilters = Array.from(document.querySelectorAll('input[name="capacity"]:checked')).map(cb => cb.value);
  const filterDate = document.getElementById('filterDate').value;
  const filterAmenities = document.getElementById('filterAmenities').value.toLowerCase();

  const checkDate = filterDate ? new Date(filterDate).toISOString().split('T')[0] : null;

  const filtered = [];
  for (const room of rooms) {
    const schedule = await getSchedule(room.id);
    const date = checkDate || new Date().toISOString().split('T')[0];
    const dayBookings = schedule.filter(b => b.date === date);
    const isBusy = dayBookings.length > 0;

    const statusMatch = (isBusy && statusFilters.includes('busy')) || (!isBusy && statusFilters.includes('free'));
    if (!statusMatch) continue;

    let capacityMatch = false;
    if (room.capacity <= 2 && capacityFilters.includes('1-2')) capacityMatch = true;
    if (room.capacity >= 3 && room.capacity <= 5 && capacityFilters.includes('3-5')) capacityMatch = true;
    if (room.capacity >= 6 && room.capacity <= 10 && capacityFilters.includes('6-10')) capacityMatch = true;
    if (room.capacity > 10 && capacityFilters.includes('10+')) capacityMatch = true;

    if (capacityFilters.length > 0 && !capacityMatch) continue;

    if (filterAmenities && !room.amenities.toLowerCase().includes(filterAmenities)) continue;

    filtered.push(room);
  }

  await displayRooms(filtered);
}

export async function resetFilters() {
  document.querySelectorAll('input[name="status"]').forEach(cb => cb.checked = true);
  document.querySelectorAll('input[name="capacity"]').forEach(cb => cb.checked = true);
  document.getElementById('filterDate').value = '';
  document.getElementById('filterAmenities').value = '';

  await displayRooms(rooms);
}