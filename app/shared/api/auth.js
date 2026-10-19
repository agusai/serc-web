window.SERCAPI = {
  auth: {
    async getSession() {
      return window.SERCUtils.readSession();
    }
  },
  users: {
    async list() {
      return [
        { id: 'u1', name: 'Aisha Rahman', role: 'coach' },
        { id: 'u2', name: 'Daniel Lee', role: 'management' },
        { id: 'u3', name: 'Farid Haris', role: 'player' }
      ];
    }
  },
  players: {
    async list() {
      return [
        { id: 'p1', name: 'Hafiz Naim', category: 'U14 Boys', role: 'player' },
        { id: 'p2', name: 'Aiman Yusuf', category: 'U12 Boys', role: 'player' },
        { id: 'p3', name: 'Yusuf Harun', category: 'U10 Boys', role: 'player' }
      ];
    }
  },
  matches: {
    async list() {
      return [
        { id: 'm1', opponent: 'KL Falcons', date: '2026-10-12', venue: 'Serdang Field' },
        { id: 'm2', opponent: 'PJ Rugby', date: '2026-10-18', venue: 'PJ Sports Complex' }
      ];
    }
  },
  trainings: {
    async list() {
      return [
        { id: 't1', title: 'Skills session', date: '2026-10-14', attendance: 18 },
        { id: 't2', title: 'Conditioning', date: '2026-10-16', attendance: 21 }
      ];
    }
  },
  fees: {
    async list() {
      return [
        { player: 'Hafiz Naim', status: 'Paid', amount: 450 },
        { player: 'Aiman Yusuf', status: 'Pending', amount: 450 }
      ];
    }
  },
  events: {
    async list() {
      return [
        { title: 'Training Camp', date: '2026-10-21' },
        { title: 'Parents Briefing', date: '2026-10-25' }
      ];
    }
  },
  announcements: {
    async list() {
      return [
        { title: 'New season registration open', date: '2026-10-10' },
        { title: 'Match kit update', date: '2026-10-11' }
      ];
    }
  }
};
