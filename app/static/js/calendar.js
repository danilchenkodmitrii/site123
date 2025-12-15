const API_BASE = 'http://localhost:5000/api';

class CalendarModule {
  constructor() {
    this.rooms = [];
    this.bookings = {};
  }

  async initializeRooms() {
    try {
      const response = await fetch(`${API_BASE}/rooms`);
      this.rooms = await response.json();
    } catch (error) {
      console.error('Error loading rooms:', error);
      this.rooms = [];
    }
  }

  getRooms() {
    return this.rooms;
  }

  getSchedule(roomId) {
    return this.bookings[roomId] || [];
  }

  async loadRoomBookings(roomId) {
    try {
      const response = await fetch(`${API_BASE}/bookings/room/${roomId}`);
      this.bookings[roomId] = await response.json();
    } catch (error) {
      console.error('Error loading bookings:', error);
      this.bookings[roomId] = [];
    }
  }

  async addBooking(roomId, booking) {
    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      });
      const newBooking = await response.json();
      if (!this.bookings[roomId]) this.bookings[roomId] = [];
      this.bookings[roomId].push(newBooking);
      return newBooking;
    } catch (error) {
      console.error('Error creating booking:', error);
      return null;
    }
  }

  async cancelBooking(bookingId) {
    try {
      await fetch(`${API_BASE}/bookings/${bookingId}`, { method: 'DELETE' });
      for (const roomId in this.bookings) {
        this.bookings[roomId] = this.bookings[roomId].filter(b => b.id !== bookingId);
      }
    } catch (error) {
      console.error('Error canceling booking:', error);
    }
  }
}

const calendarModule = new CalendarModule();

export async function initializeCalendar() {
  await calendarModule.initializeRooms();
}

export function getRooms() {
  return calendarModule.getRooms();
}

export async function getSchedule(roomId) {
  await calendarModule.loadRoomBookings(roomId);
  return calendarModule.getSchedule(roomId);
}

export function addBooking(roomId, booking) {
  return calendarModule.addBooking(roomId, booking);
}

export function cancelBooking(bookingId) {
  return calendarModule.cancelBooking(bookingId);
}