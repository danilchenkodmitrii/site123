import { getAllUsers, setCurrentUser, getCurrentUser } from './auth.js';
import { showNotification } from './notifications.js';

function getRoleLabel(role) {
  const labels = {
    'user': 'Пользователь',
    'manager': 'Менеджер',
    'admin': 'Администратор'
  };
  return labels[role] || role;
}

export function showProfile() {
  const users = getAllUsers();
  const currentUserId = localStorage.getItem('currentUserId');
  const current = getCurrentUser();
  
  if (!current) {
    showNotification('Пользователь не найден', 'error');
    return;
  }
  
  document.getElementById('displayName').textContent = current.name || '';
  document.getElementById('displayEmail').textContent = current.email || '';
  document.getElementById('displayRole').textContent = getRoleLabel(current.role);
  
  const usersList = document.getElementById('usersList');
  usersList.innerHTML = '';
  
  users.forEach(user => {
    const item = document.createElement('div');
    item.className = `user-item ${user.id === currentUserId ? 'active' : ''}`;
    item.innerHTML = `
      <div class=\"user-item-info\">
        <div class=\"user-item-name\">${user.name}</div>
        <div class=\"user-item-email\">${user.email}</div>
        <div class=\"user-item-role\">${getRoleLabel(user.role)}</div>
      </div>
      ${user.id !== currentUserId ? `
        <button class=\"btn btn-primary btn-small\" onclick=\"app.switchUser('${user.id}')\">Выбрать</button>
      ` : `
        <span class=\"current-badge\">Текущий</span>
      `}
    `;
    usersList.appendChild(item);
  });
}

export function switchUser(userId) {
  setCurrentUser(userId);
  const current = getCurrentUser();
  showNotification(`Вы вошли как ${current.name}`, 'success');
  showProfile();
  window.app.updateUserDisplay();
}