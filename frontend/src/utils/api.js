const API_BASE = process.env.REACT_APP_API_URL || ''
const PROFILE_KEY = 'sv-profile-id'

function getProfileId() {
  let id = localStorage.getItem(PROFILE_KEY)
  if (!id) {
    id = window.crypto?.randomUUID?.() || `acolyte-${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(PROFILE_KEY, id)
  }
  return id
}

export async function apiRequest(path, options = {}) {
  const separator = path.includes('?') ? '&' : '?'
  const response = await fetch(`${API_BASE}/api${path}${separator}profile=${encodeURIComponent(getProfileId())}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'Связь с сервером сектора потеряна.')
  return payload
}

export function postJson(path, body) {
  return apiRequest(path, { method: 'POST', body: JSON.stringify({ ...body, profile: getProfileId() }) })
}
