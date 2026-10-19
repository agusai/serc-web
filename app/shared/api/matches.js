window.SERCAPI.matches = window.SERCAPI.matches || { list: async () => [] };
window.SERCAPI.matches.getById = async (id) => ({
  id,
  opponent: 'Sample Opponent',
  venue: 'Club Field',
  status: 'scheduled'
});
