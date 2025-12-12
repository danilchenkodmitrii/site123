import { initializeAuth, getCurrentUser, logout, isAdmin, getAllUsers, setCurrentUser, createUser, loginWithPassword } from './auth.js';
import { showNotification } from './notifications.js';

class SoveshaikaApp {
  constructor() {
    this.currentUser = null;
    this.rooms = [];
    this.users = [];
    this.init();
  }

  async init() {
    await initializeAuth();
    this.currentUser = getCurrentUser();
    this.users = getAllUsers();
    this.setupEventListeners();

    if (this.currentUser) {
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

    document.querySelector('.logout-btn').addEventListener('click', () => {
      this.logout();
    });

    document.querySelector('.user-name').addEventListener('click', () => {
      this.switchView('profile');
    });
  }

  async loadRooms() {
    try {
      const response = await fetch('/api/rooms/');
      if (response.ok) {
        this.rooms = await response.json();
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      this.rooms = [];
    }
  }

  showAuthView() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('auth').classList.add('active');
    this.loadAuthUsersList();
  }

  loadAuthUsersList() {
    const list = document.getElementById('authUsersList');
    const users = this.users;
    list.innerHTML = '';

    users.forEach(user => {
      const button = document.createElement('button');
      button.className = 'auth-user-btn';
      button.innerHTML = `
        <div class="auth-user-info">
          <div class="auth-user-name">${user.name}</div>
          <div class="auth-user-email">${user.email}</div>
          <div class="auth-user-role">${this.getRoleLabel(user.role)}</div>
        </div>
      `;
      button.addEventListener('click', () => {
        this.loginUser(user.email, 'password123');
      });
      list.appendChild(button);
    });
  }

  getRoleLabel(role) {
    const labels = {
      'user': 'Пользователь',
      'manager': 'Менеджер',
      'admin': 'Администратор'
    };
    return labels[role] || role;
  }

  async loginUser(email, password) {
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const user = await response.json();
        this.currentUser = user;
        localStorage.setItem('soveshaika_user', JSON.stringify(user));
        this.updateUserDisplay();
        await this.loadRooms();
        this.switchView('home');
        showNotification(`Вход выполнен как ${user.name}`, 'success');
      } else {
        const error = await response.json();
        showNotification(error.detail || 'Ошибка входа', 'error');
      }
    } catch (error) {
      showNotification('Ошибка сети при входе', 'error');
    }
  }

  switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const viewElement = document.getElementById(viewName);
    const navButton = document.querySelector(`[data-view="${viewName}"]`);

    if (viewElement) viewElement.classList.add('active');
    if (navButton) navButton.classList.add('active');
  }

  updateUserDisplay() {
    if (this.currentUser) {
      document.querySelector('.user-name').textContent = this.currentUser.name;
      
      const adminBtn = document.querySelector('[data-view="admin"]');
      if (adminBtn) {
        adminBtn.style.display = this.currentUser.role === 'admin' ? 'inline-block' : 'none';
      }
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('soveshaika_user');
    this.showAuthView();
    showNotification('Вы вышли из системы', 'info');
  }

  switchAuthMode(mode) {
    document.getElementById('loginForm').classList.toggle('active', mode === 'login');
    document.getElementById('registerForm').classList.toggle('active', mode === 'register');
    
    // При переключении на логин показываем список пользователей по умолчанию
    if (mode === 'login') {
      this.switchLoginMode('list');
    }
  }

  switchLoginMode(mode) {
    document.querySelectorAll('.auth-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-login-mode').forEach(m => m.classList.remove('active'));
    
    if (mode === 'list') {
      document.querySelectorAll('.auth-tab-btn')[0].classList.add('active');
      document.getElementById('loginList').classList.add('active');
    } else {
      document.querySelectorAll('.auth-tab-btn')[1].classList.add('active');
      document.getElementById('loginPasswordForm').classList.add('active'); // Исправленный ID
    }
  }

  async passwordLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
      showNotification('Заполните email и пароль', 'error');
      return;
    }

    const result = await loginWithPassword(email, password);
    if (result.success) {
      this.currentUser = result.user;
      this.updateUserDisplay();
      document.getElementById('loginEmail').value = '';
      document.getElementById('loginPassword').value = '';
      
      await this.loadRooms();
      this.switchView('home');
      showNotification(`Вход выполнен как ${result.user.name}`, 'success');
    } else {
      showNotification(result.message, 'error');
    }
  }

  async registerUser() {
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

    const result = await createUser(firstName, lastName, email, password);
    if (result.success) {
      this.currentUser = result.user;
      this.updateUserDisplay();
      
      // Очищаем форму
      document.getElementById('registerFirstName').value = '';
      document.getElementById('registerLastName').value = '';
      document.getElementById('registerEmail').value = '';
      document.getElementById('registerPassword').value = '';
      
      // Переключаемся на домашнюю страницу
      await this.loadRooms();
      this.switchView('home');
      showNotification(`Добро пожаловать, ${firstName}!`, 'success');
    } else {
      showNotification(result.message, 'error');
    }
  }
  updateUI() {
    if (this.currentUser) {
        // Обновляем имя пользователя
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = this.currentUser.name;
        }

        // Показываем/скрываем кнопку администратора
        const adminBtn = document.querySelector('[data-view="admin"]');
        if (adminBtn) {
            if (this.currentUser.role === 'admin') {
                adminBtn.style.display = 'inline-block';
            } else {
                adminBtn.style.display = 'none';
            }
        }

        // Обновляем профиль
        if (document.getElementById('displayName')) {
            document.getElementById('displayName').textContent = this.currentUser.name;
            document.getElementById('displayEmail').textContent = this.currentUser.email;
            document.getElementById('displayRole').textContent = this.getRoleLabel(this.currentUser.role);
        }
    }
}

getRoleLabel(role) {
    const labels = {
        'user': 'Пользователь',
        'manager': 'Менеджер', 
        'admin': 'Администратор'
    };
    return labels[role] || role;
}

switchView(viewName) {
    console.log(`🔄 Переключение на вид: ${viewName}`);
    
    // Скрыть все views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // Показать выбранный view
    const viewElement = document.getElementById(viewName);
    if (viewElement) {
        viewElement.classList.add('active');
    }

    // Обновить активную кнопку навигации
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === viewName) {
            btn.classList.add('active');
        }
    });

    // Загрузить данные для view
    switch (viewName) {
        case 'dashboard':
            this.updateDashboard();
            break;
        case 'booking':
            this.updateBookingForm();
            break;
        case 'profile':
            this.updateProfile();
            break;
        case 'admin':
            if (this.currentUser?.role === 'admin') {
                this.updateAdminPanel();
            } else {
                this.showNotification('Доступ запрещен', 'error');
                this.switchView('home');
            }
            break;
    }
}

updateAdminPanel() {
    console.log("🛠 Инициализация админ-панели");
    
    // Загружаем данные для админки
    this.loadRoomsForAdmin();
    this.loadAccessList();
    this.loadAllBookings();
    
    // Устанавливаем активную вкладку "Комнаты"
    this.switchTab('rooms');
}

switchTab(tabName) {
    console.log(`🔄 Переключение на вкладку: ${tabName}`);
    
    // Обновляем активные вкладки
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
            
            // Загружаем данные для вкладки
            switch(tabName) {
                case 'rooms':
                    this.loadRoomsForAdmin();
                    break;
                case 'access':
                    this.loadAccessList();
                    break;
                case 'bookings':
                    this.loadAllBookings();
                    break;
            }
        }
    });
}
}

window.app = new SoveshaikaApp();