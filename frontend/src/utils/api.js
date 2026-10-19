const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '')
const TOKEN_KEY = 'sv-access-token'
const USER_KEY = 'sv-user'
let accessToken = null

export function isAuthenticated() {
  return Boolean(localStorage.getItem(USER_KEY))
}

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
}

export function saveAuth(auth) {
  accessToken = auth.token
  localStorage.removeItem(TOKEN_KEY)
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user))
  window.dispatchEvent(new CustomEvent('sv-user-updated', { detail: auth.user }))
}

export function updateCurrentUser(user) {
  const updated = { ...getCurrentUser(), ...user }
  localStorage.setItem(USER_KEY, JSON.stringify(updated))
  window.dispatchEvent(new CustomEvent('sv-user-updated', { detail: updated }))
  return updated
}

export function clearAuth() {
  accessToken = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export async function apiRequest(path, options = {}) {
  const makeRequest = () => {
    const headers = { 'Content-Type': 'application/json', ...options.headers }
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
    return fetch(`${API_BASE}/api${path}`, { ...options, headers, credentials: 'include' })
  }
  let response = await makeRequest()
  let payload = await response.json().catch(() => ({}))
  const publicAuthPath = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'].includes(path)
  if (response.status === 401 && isAuthenticated() && !publicAuthPath) {
    try {
      const refreshedResponse = await fetch(`${API_BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
      const refreshed = await refreshedResponse.json().catch(() => ({}))
      if (!refreshedResponse.ok || !refreshed.token || !refreshed.user) throw new Error('Refresh failed')
      saveAuth(refreshed)
      response = await makeRequest()
      payload = await response.json().catch(() => ({}))
    } catch {
      clearAuth()
      window.location.assign('/login')
    }
  }
  if (payload.token && payload.user) saveAuth(payload)
  if (!response.ok) throw new Error(payload.error || 'Связь с сервером сектора потеряна.')
  return payload
}

export async function logout() {
  try { await apiRequest('/auth/logout', { method: 'POST' }) } catch { /* the local session still needs to end */ }
  clearAuth()
}

export function postJson(path, body) {
  return apiRequest(path, { method: 'POST', body: JSON.stringify(body) })
}
