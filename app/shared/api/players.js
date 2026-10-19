window.SERCAPI.players = window.SERCAPI.players || { list: async () => [] };
window.SERCAPI.players.getById = async (id) => ({
  id,
  name: 'Sample Player',
  category: 'U14 Boys',
  team: 'Senior Academy'
});
