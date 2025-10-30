export function saveAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function getToken() { 
  return localStorage.getItem('token'); 
}

export function getUser() {
  try { 
    return JSON.parse(localStorage.getItem('user') || 'null'); 
  } catch { 
    return null; 
  }
}

export function logout() {
  localStorage.removeItem('token'); 
  localStorage.removeItem('user');
}

export function isAuthenticated() {
  const token = getToken();
  const user = getUser();
  
  if (!token || !user) {
    return false;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    
    if (isExpired) {
      logout(); 
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verificando token:', error);
    return false;
  }
}