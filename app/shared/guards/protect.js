window.SERC_GUARDS = {
  protect(requiredRole) {
    const session = JSON.parse(sessionStorage.getItem('serc_session') || '{}');
    const role = session.role || 'guest';
    if (requiredRole && role !== requiredRole && role !== 'superadmin') {
      window.location.href = '../login.html';
      return false;
    }
    return true;
  }
};
