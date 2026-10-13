const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '')
const TOKEN_KEY = 'sv-access-token'
const USER_KEY = 'sv-user'

export function isAuthenticated() {
  return Boolean(localStorage.getItem(TOKEN_KEY))
}

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
}

export function saveAuth(auth) {
  localStorage.setItem(TOKEN_KEY, auth.token)
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers,
  })
  const payload = await response.json().catch(() => ({}))
  if (response.status === 401 && token && !path.startsWith('/auth/')) {
    clearAuth()
    window.location.assign('/login')
  }
  if (!response.ok) throw new Error(payload.error || 'Связь с сервером сектора потеряна.')
  return payload
}

export function postJson(path, body) {
  return apiRequest(path, { method: 'POST', body: JSON.stringify(body) })
}
