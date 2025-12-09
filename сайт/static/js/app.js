import { initializeAuth, getCurrentUser, logout, isAdmin, getAllUsers, setCurrentUser, createUser } from './auth.js';
import { initializeCalendar, getRooms } from './calendar.js';
import { showNotification } from './notifications.js';
import { initializeDashboard, showDashboard, applyFilters, resetFilters, displayRooms } from './dashboard.js';
import { initializeBooking, populateRoomSelects, showBooking, updateTimeSlots, confirmBooking } from './booking.js';
import { showProfile, switchUser } from './profile.js';
import { initializeAdmin, showAdmin, loadAccessList, addRoom, updateAccess } from './admin.js';

class SoveshcaykaApp {
  constructor() {
    this.currentUser = null;
    this.rooms = [];
    this.init();
  }

  async init() {
    await initializeAuth();
    await initializeCalendar();

    this.currentUser = getCurrentUser();
    this.setupEventListeners();

    // Check if user is logged in
    const currentUserId = localStorage.getItem('currentUserId');
    if (currentUserId) {
      this.updateUserDisplay();
      await this.loadRooms();
      this.showHome();
    } else {
      this.showAuthView();
    }
  }

  setupEventListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        this.switchView(view);
      });
    });

    document.getElementById('filterToggle').addEventListener('click', () => {
      document.getElementById('filterPanel').classList.toggle('active');
    });

    document.getElementById('applyFilters').addEventListener('click', () => {
      applyFilters();
    });

    document.getElementById('resetFilters').addEventListener('click', () => {
      resetFilters();
    });

    document.querySelector('.user-name').addEventListener('click', () => {
      this.switchView('profile');
    });

    document.querySelector('.logout-btn').addEventListener('click', () => {
      logout();
      location.reload();
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        const tab = e.target.dataset.tab;
        document.getElementById(`${tab}-tab`).classList.add('active');
      });
    });

    document.getElementById('bookingDate').addEventListener('change', () => {
      updateTimeSlots();
    });

    document.getElementById('roomSelect').addEventListener('change', () => {
      updateTimeSlots();
    });

    document.getElementById('confirmBooking').addEventListener('click', () => {
      confirmBooking(this.currentUser);
    });

    if (isAdmin()) {
      document.getElementById('addRoomBtn').addEventListener('click', () => {
        if (addRoom()) {
          this.loadRooms();
        }
      });

      document.getElementById('updateAccessBtn').addEventListener('click', () => {
        updateAccess();
      });

      initializeAdmin();
    }
  }

  switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const viewElement = document.getElementById(viewName);
    const navButton = document.querySelector(`[data-view="${viewName}"]`);

    if (viewElement) viewElement.classList.add('active');
    if (navButton) navButton.classList.add('active');

    if (viewName === 'home') {
      this.showHome();
    } else if (viewName === 'dashboard') {
      showDashboard();
    } else if (viewName === 'booking') {
      showBooking();
    } else if (viewName === 'profile') {
      showProfile();
    } else if (viewName === 'admin') {
      showAdmin(this.rooms);
      loadAccessList();
    }
  }

  async loadRooms() {
    this.rooms = getRooms();
    initializeDashboard(this.rooms);
    initializeBooking(this.rooms);
    populateRoomSelects();
  }

  showHome() {
    // removed home initialization logic
  }

  updateUserDisplay() {
    if (this.currentUser) {
      document.querySelector('.user-name').textContent = this.currentUser.name;

      if (isAdmin()) {
        document.querySelector('[data-view="admin"]').style.display = 'block';
      }
    }
  }

  async deleteRoom(roomId) {
    if (confirm('Вы уверены? Это удалит все данные комнаты.')) {
      try {
        await fetch(`http://localhost:5000/api/rooms/${roomId}`, { method: 'DELETE' });
        showNotification('Комната удалена', 'success');
        await this.loadRooms();
        showAdmin(this.rooms);
      } catch (error) {
        showNotification('Ошибка при удалении комнаты', 'error');
      }
    }
  }

  async deleteBooking(bookingId) {
    if (confirm('Отменить это бронирование?')) {
      try {
        await fetch(`http://localhost:5000/api/bookings/${bookingId}`, { method: 'DELETE' });
        showNotification('Бронирование отменено', 'success');
        showAdmin(this.rooms);
      } catch (error) {
        showNotification('Ошибка при отмене бронирования', 'error');
      }
    }
  }

  async editRoomPrice(roomId) {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) return;

    const newPrice = prompt(`Новая цена для комнаты "${room.name}" (текущая: ${room.price} ₽/ч):`, room.price);

    if (newPrice !== null && newPrice.trim() !== '') {
      const price = parseFloat(newPrice);
      if (isNaN(price) || price < 0) {
        showNotification('Введите корректную цену', 'error');
        return;
      }

      try {
        await fetch(`http://localhost:5000/api/rooms/${roomId}/price`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ price })
        });
        showNotification(`Цена комнаты "${room.name}" обновлена на ${price} ₽/ч`, 'success');
        await this.loadRooms();
        showAdmin(this.rooms);
      } catch (error) {
        showNotification('Ошибка при обновлении цены', 'error');
      }
    }
  }

  switchUser(userId) {
    switchUser(userId);
  }

  updateUserRole(userId) {
    // removed role update logic - use updateAccess() instead
  }

  switchAuthMode(mode) {
    document.getElementById('loginForm').classList.toggle('active', mode === 'login');
    document.getElementById('registerForm').classList.toggle('active', mode === 'register');
  }

  showAuthView() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('auth').classList.add('active');
    this.loadAuthUsersList();
  }

  loadAuthUsersList() {
    const list = document.getElementById('authUsersList');
    const users = getAllUsers();
    list.innerHTML = '';

    users.forEach(user => {
      const button = document.createElement('button');
      button.className = 'auth-user-btn';
      button.innerHTML = `
        <div class="auth-user-info">
          <div class="auth-user-name">${user.name}</div>
          <div class="auth-user-email">${user.email}</div>
        </div>
      `;
      button.addEventListener('click', () => {
        setCurrentUser(user.id);
        this.currentUser = getCurrentUser();
        this.updateUserDisplay();
        this.loadRooms().then(() => {
          this.showHome();
          document.getElementById('auth').classList.remove('active');
          document.getElementById('home').classList.add('active');
        });
      });
      list.appendChild(button);
    });
  }

  registerUser() {
    const firstName = document.getElementById('registerFirstName').value.trim();
    const lastName = document.getElementById('registerLastName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();

    if (!firstName || !lastName || !email || !password) {
      showNotification('Заполните все поля', 'error');
      return;
    }

    if (!email.includes('@')) {
      showNotification('Введите корректный email', 'error');
      return;
    }

    if (password.length < 4) {
      showNotification('Пароль должен содержать минимум 4 символа', 'error');
      return;
    }

    const result = createUser(firstName, lastName, email, password);
    if (result.success) {
      this.currentUser = result.user;
      this.updateUserDisplay();
      document.getElementById('registerFirstName').value = '';
      document.getElementById('registerLastName').value = '';
      document.getElementById('registerEmail').value = '';
      document.getElementById('registerPassword').value = '';
      this.switchAuthMode('login');
      showNotification(`Добро пожаловать, ${firstName}!`, 'success');
      this.loadRooms().then(() => {
        this.showHome();
        document.getElementById('auth').classList.remove('active');
        document.getElementById('home').classList.add('active');
      });
    } else {
      showNotification(result.message, 'error');
    }
  }
}

window.app = new SoveshcaykaApp();