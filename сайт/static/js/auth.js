const API_BASE = 'http://localhost:5000/api';

class AuthModule {
  constructor() {
    this.users = [];
    this.currentUser = null;
  }

  async initializeUsers() {
    try {
      const response = await fetch(`${API_BASE}/users`);
      this.users = await response.json();
    } catch (error) {
      console.error('Error loading users:', error);
      this.users = [];
    }
  }

  getCurrentUser() {
    const userId = localStorage.getItem('currentUserId');
    return this.users.find(u => u.id === userId) || this.users[0];
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
    return this.users;
  }

  setCurrentUser(userId) {
    localStorage.setItem('currentUserId', userId);
  }

  async createUser(firstName, lastName, email, password) {
    try {
      const response = await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password })
      });

      if (!response.ok) {
        return { success: false, message: 'Email already exists' };
      }

      const newUser = await response.json();
      this.users.push(newUser);
      localStorage.setItem('currentUserId', newUser.id);
      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, message: 'Error creating user' };
    }
  }
}

const authModule = new AuthModule();

export async function initializeAuth() {
  await authModule.initializeUsers();
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

export function createUser(firstName, lastName, email, password) {
  return authModule.createUser(firstName, lastName, email, password);
}