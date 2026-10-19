// Replace previous SERCAPI stubs with live Supabase-backed adapters using the REST helper
window.SERCAPI = window.SERCAPI || {};

window.SERCAPI.auth = {
  async getSession() {
    try {
      return window.SERCUtils.readSession();
    } catch (e) {
      return {};
    }
  }
};

window.SERCAPI.users = {
  async list() {
    return await window.SERC_SUPABASE_CLIENT.list('users');
  },
  async getById(id) {
    return await window.SERC_SUPABASE_CLIENT.getById('users', id);
  }
};

window.SERCAPI.players = {
  async list() {
    return await window.SERC_SUPABASE_CLIENT.list('players');
  },
  async getById(id) {
    return await window.SERC_SUPABASE_CLIENT.getById('players', id);
  }
};

window.SERCAPI.matches = {
  async list() {
    return await window.SERC_SUPABASE_CLIENT.list('matches');
  },
  async getById(id) {
    return await window.SERC_SUPABASE_CLIENT.getById('match_details', id, 'match_id');
  }
};

window.SERCAPI.trainings = {
  async list() {
    return await window.SERC_SUPABASE_CLIENT.list('trainings');
  },
  async getById(id) {
    return await window.SERC_SUPABASE_CLIENT.getById('training_details', id, 'training_id');
  }
};

window.SERCAPI.fees = {
  async list() {
    return await window.SERC_SUPABASE_CLIENT.list('fees');
  },
  async getByPlayer(playerId) {
    return await window.SERC_SUPABASE_CLIENT.queryRaw('fees', `select=*&player_id=eq.${encodeURIComponent(playerId)}`);
  }
};

window.SERCAPI.events = {
  async list() {
    return await window.SERC_SUPABASE_CLIENT.list('events');
  }
};

window.SERCAPI.announcements = {
  async list() {
    return await window.SERC_SUPABASE_CLIENT.list('announcements');
  }
};
