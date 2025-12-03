class AuthModule {
  constructor() {
    this.initializeUsers();
  }

  initializeUsers() {
    const users = localStorage.getItem('users');
    if (!users) {
      const defaultUsers = [
        { id: 'user_1', name: 'Алексей Иванов', email: 'alex@company.com', role: 'admin' },
        { id: 'user_2', name: 'Мария Петрова', email: 'maria@company.com', role: 'user' },
        { id: 'user_3', name: 'Иван Сидоров', email: 'ivan@company.com', role: 'manager' }
      ];
      localStorage.setItem('users', JSON.stringify(defaultUsers));
      localStorage.setItem('currentUserId', 'user_1');
    }
  }

  getCurrentUser() {
    const userId = localStorage.getItem('currentUserId') || 'user_1';
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.find(u => u.id === userId) || users[0];
  }

  isAdmin() {
    return this.getCurrentUser()?.role === 'admin';
  }

  isManager() {
    return this.getCurrentUser()?.role === 'manager';
  }

  logout() {
    localStorage.removeItem('currentUserId');
  }

  getAllUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
  }

  setCurrentUser(userId) {
    localStorage.setItem('currentUserId', userId);
  }

  createUser(name, email) {
    const users = this.getAllUsers();
    
    // Check if email already exists
    if (users.some(u => u.email === email)) {
      return { success: false, message: 'Пользователь с таким email уже существует' };
    }

    const newUser = {
      id: 'user_' + Date.now(),
      name,
      email,
      role: 'user'
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUserId', newUser.id);

    return { success: true, user: newUser };
  }
}

const authModule = new AuthModule();

export function initializeAuth() {
  authModule.initializeUsers();
}

export function getCurrentUser() {
  return authModule.getCurrentUser();
}

export function isAdmin() {
  return authModule.isAdmin();
}

export function isManager() {
  return authModule.isManager();
}

export function logout() {
  authModule.logout();
}

export function getAllUsers() {
  return authModule.getAllUsers();
}

export function setCurrentUser(userId) {
  authModule.setCurrentUser(userId);
}

export function createUser(name, email) {
  const result = authModule.createUser(name, email);
  return result;
}