import React from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { isAuthenticated, postJson, saveAuth } from '../utils/api'
import './AuthPage.css'

export default function AuthPage({ register = false }) {
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  if (isAuthenticated()) return <Navigate to="/" replace />

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await postJson(register ? '/auth/register' : '/auth/login', { username, password })
      saveAuth(result)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return <main className="auth-page">
    <Link to="/" className="brand auth-brand"><span className="brand-seal">V</span><span><b>SECTOR</b><small>VERMILLION · 41K</small></span></Link>
    <section className="auth-card">
      <p className="eyebrow">АРХИВИУМ · ДОСТУП ПО ПРОПУСКУ</p>
      <h1>{register ? 'Создать аккаунт' : 'Войти в архив'}</h1>
      <p className="auth-intro">{register ? 'Зарегистрируй позывной, чтобы сохранить прогресс и открытые главы.' : 'Введи позывной и пароль, чтобы продолжить исследование сектора.'}</p>
      <form className="auth-form" onSubmit={submit}>
        <label htmlFor="username">ПОЗЫВНОЙ</label>
        <input id="username" name="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" required />
        <small>3–24 символа: латинские буквы, цифры или _</small>
        <label htmlFor="password">ПАРОЛЬ</label>
        <input id="password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={register ? 'new-password' : 'current-password'} minLength={8} maxLength={128} required />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? 'ПРОВЕРКА…' : register ? 'Зарегистрироваться' : 'Войти'} <span>→</span></button>
      </form>
      <p className="auth-switch">{register ? 'Уже есть аккаунт?' : 'Впервые в секторе?'} <Link to={register ? '/login' : '/register'}>{register ? 'Войти' : 'Создать аккаунт'}</Link></p>
    </section>
    <span className="auth-footer">НЕ ПЕРЕДАВАЙ ПАРОЛЬ АРХИВУ. АРХИВУ ДОСТАТОЧНО ЕГО ХЕША.</span>
  </main>
}
