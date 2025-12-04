class CalendarModule {
  constructor() {
    this.initializeRooms();
  }

  initializeRooms() {
    const rooms = localStorage.getItem('rooms');
    if (!rooms) {
      const defaultRooms = [
        {
          id: 'room_1',
          name: 'Переговорная "Альфа"',
          capacity: 6,
          amenities: 'Видеоконференция, Smart board',
          price: 500,
          createdAt: new Date().toISOString()
        },
        {
          id: 'room_2',
          name: 'Переговорная "Бета"',
          capacity: 4,
          amenities: 'Проектор, флипчарт',
          price: 350,
          createdAt: new Date().toISOString()
        },
        {
          id: 'room_3',
          name: 'Переговорная "Гамма"',
          capacity: 10,
          amenities: 'Видеоконференция, 4K экран, микрофонная система',
          price: 800,
          createdAt: new Date().toISOString()
        },
        {
          id: 'room_4',
          name: 'Переговорная "Дельта"',
          capacity: 2,
          amenities: 'Звукоизоляция',
          price: 250,
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('rooms', JSON.stringify(defaultRooms));

      // Initialize schedules
      defaultRooms.forEach(room => {
        const schedule = this.generateDemoSchedule(room.id);
        localStorage.setItem(`schedule_${room.id}`, JSON.stringify(schedule));
      });
    }
  }

  generateDemoSchedule(roomId) {
    const today = new Date();
    const schedule = [];

    // Add some demo bookings
    const bookings = [
      { startTime: '09:00', endTime: '10:00', title: 'Планерка отдела', userName: 'Мария Петрова', daysOffset: 0 },
      { startTime: '11:00', endTime: '12:30', title: 'Презентация проекта', userName: 'Иван Сидоров', daysOffset: 0 },
      { startTime: '14:00', endTime: '15:00', title: 'Встреча с клиентом', userName: 'Алексей Иванов', daysOffset: 1 },
      { startTime: '10:00', endTime: '11:00', title: 'Планирование спринта', userName: 'Мария Петрова', daysOffset: 2 }
    ];

    bookings.forEach((booking, idx) => {
      const date = new Date(today);
      date.setDate(date.getDate() + booking.daysOffset);
      schedule.push({
        id: `booking_${roomId}_${idx}`,
        roomId,
        date: date.toISOString().split('T')[0],
        startTime: booking.startTime,
        endTime: booking.endTime,
        title: booking.title,
        userName: booking.userName,
        participants: [],
        userId: `user_${idx}`,
        createdAt: new Date().toISOString()
      });
    });

    return schedule;
  }

  getRooms() {
    return JSON.parse(localStorage.getItem('rooms') || '[]');
  }

  getSchedule(roomId) {
    return JSON.parse(localStorage.getItem(`schedule_${roomId}`) || '[]');
  }

  addBooking(roomId, booking) {
    const schedule = this.getSchedule(roomId);
    schedule.push(booking);
    localStorage.setItem(`schedule_${roomId}`, JSON.stringify(schedule));
  }

  cancelBooking(roomId, bookingId) {
    let schedule = this.getSchedule(roomId);
    schedule = schedule.filter(b => b.id !== bookingId);
    localStorage.setItem(`schedule_${roomId}`, JSON.stringify(schedule));
  }
}

const calendarModule = new CalendarModule();

export function initializeCalendar() {
  calendarModule.initializeRooms();
}

export function getRooms() {
  return calendarModule.getRooms();
}

export function getSchedule(roomId) {
  return calendarModule.getSchedule(roomId);
}

export function addBooking(roomId, booking) {
  calendarModule.addBooking(roomId, booking);
}

export function cancelBooking(roomId, bookingId) {
  calendarModule.cancelBooking(roomId, bookingId);
}