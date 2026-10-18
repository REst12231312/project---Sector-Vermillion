import React from 'react'
import { Link } from 'react-router-dom'
import { ONLINE_IDENTITY_CHOICES } from '../data/onlineChoices'
import { FACTION_DETAILS } from '../utils/gameProgress'
import { apiRequest, getCurrentUser, updateCurrentUser } from '../utils/api'
import './OnlinePage.css'

export default function OnlinePage() {
  const user = getCurrentUser()
  const factionId = FACTION_DETAILS[user?.faction] ? user.faction : 'imperium'
  const faction = FACTION_DETAILS[factionId]
  const identity = ONLINE_IDENTITY_CHOICES[factionId]
  const [identityChoice, setIdentityChoice] = React.useState(identity ? user?.[identity.field] || '' : '')
  const [identityBusy, setIdentityBusy] = React.useState(false)
  const [identityMessage, setIdentityMessage] = React.useState('')
  const savedChoice = identity ? user?.[identity.field] || '' : ''

  async function saveIdentity() {
    if (!identity || identityBusy || identityChoice === savedChoice) return
    setIdentityBusy(true)
    setIdentityMessage('')
    try {
      const result = await apiRequest('/online-profile', { method: 'PUT', body: JSON.stringify({ value: identityChoice }) })
      updateCurrentUser(result.user)
      setIdentityMessage('Выбор сохранён.')
    } catch (error) {
      setIdentityMessage(error.message || 'Не удалось сохранить выбор.')
    } finally {
      setIdentityBusy(false)
    }
  }

  return <main className={`content-page online-page ${factionId === 'chaos' ? 'chaos-theme' : factionId === 'orks' ? 'orks-theme' : factionId === 'tau' ? 'tau-theme' : ''}`}>
    <Link className="back-link" to="/campaign">← Карта кампании</Link>
    <p className="eyebrow">СЕТЕВОЙ РЕЖИМ · ПОДГОТОВКА СОЕДИНЕНИЯ</p>
    <h1>Sector: Vermillion</h1>
    <section className="online-connection" aria-label="Статус онлайн-режима">
      <div className="online-connection-heading"><div><p className="eyebrow">УЗЕЛ СВЯЗИ · VER-IX</p><h2>Соединение не установлено</h2></div><span className="online-connection-state"><i />ОФЛАЙН</span></div>
      <p>Когда сетевой модуль будет подключён, этот раздел станет точкой входа в совместные операции.</p>
      <div className="online-connection-grid"><div><span>ПОЗЫВНОЙ</span><b>{user?.username || 'НЕИЗВЕСТЕН'}</b></div><div><span>ФРАКЦИЯ</span><b>{faction.name}</b></div><div>{identity ? <><span>{identity.label}</span><span className="online-select-wrap"><select id="online-subfaction" aria-label={identity.label} value={identityChoice} onChange={(event) => { setIdentityChoice(event.target.value); setIdentityMessage('') }}><option value="">Не выбран</option>{identity.options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></span></> : <><span>ЗВАНИЕ</span><b>ПРОФИЛЬ ФРАКЦИИ</b></>}</div></div>
      <div className="online-connection-actions"><Link className="text-link" to="/profile">Профиль игрока <span>→</span></Link>{identity && <div className="online-identity-save"><button className="button button-outline" type="button" onClick={saveIdentity} disabled={identityBusy || identityChoice === savedChoice}>{identityBusy ? 'СОХРАНЯЮ…' : 'Сохранить выбор'} <span>✓</span></button>{identityMessage && <p role="status">{identityMessage}</p>}</div>}<button className="button button-primary" type="button" disabled title="Сетевые операции пока не подключены">Войти в онлайн-операцию <span>↗</span></button></div>
    </section>

    <section className="online-readiness"><div><p className="eyebrow">СОСТОЯНИЕ МОДУЛЯ</p><h2>Подготовка завершена частично</h2></div><div className="online-readiness-row"><span><i className="readiness-ready" />Профиль командира</span><b>ГОТОВ</b></div><div className="online-readiness-row"><span><i className="readiness-ready" />Фракционная идентичность</span><b>ГОТОВА</b></div><div className="online-readiness-row"><span><i />Сетевые сессии</span><b>ОЖИДАНИЕ МОДУЛЯ</b></div></section>
  </main>
}
