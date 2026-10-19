window.SERC_GUARDS = window.SERC_GUARDS || {};
window.SERC_GUARDS.protect = function (role) {
  const allowedRoles = ['superadmin', 'management', 'coaching', 'headcoach', 'parent', 'player', 'guest'];
  const sessionRole = localStorage.getItem('serc_role') || role || 'guest';

  if (!allowedRoles.includes(sessionRole)) {
    return false;
  }

  if (sessionRole === 'superadmin') return true;
  if (sessionRole === 'coaching' || sessionRole === 'headcoach') return role === 'coaching' || role === 'headcoach' || role === 'guest';
  return sessionRole === role;
};
