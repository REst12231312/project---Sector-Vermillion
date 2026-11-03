import React from 'react'
import { Link } from 'react-router-dom'
import { campaignLevels } from '../../../data/imperiumCampaign'
import { FACTION_DETAILS } from '../../../utils/gameProgress'

export default function CampaignCompletion({ operationId, returnPath, sync = { status: 'idle' }, onRetry }) {
  const operation = campaignLevels.find((entry) => entry.id === operationId)
  if (!operation) return null
  const report = sync.report
  const stats = report?.statistics
  return <section className="tactical-campaign-completion" role="status" aria-live="polite">
    <p className="tactical-card-kicker">ПЛАНЕТАРНАЯ КАМПАНИЯ · {sync.status === 'saved' ? 'РЕЗУЛЬТАТ ПОДТВЕРЖДЁН' : sync.status === 'syncing' ? 'СОХРАНЕНИЕ РЕЗУЛЬТАТА' : 'ОЖИДАЕТ ПОДТВЕРЖДЕНИЯ СЕРВЕРОМ'}</p>
    <h3>Операция «{operation.title}» завершена</h3>
    {sync.status === 'syncing' && <p>Сохраняем итог кампании и синхронизируем награды с профилем…</p>}
    {sync.status === 'error' && <><p>{sync.error || 'Не удалось подтвердить кампанию. Прогресс миссий сохранён; награды пока не начислены.'}</p><button type="button" onClick={onRetry}>Повторить синхронизацию</button></>}
    {sync.status === 'idle' && <><p>Все обязательные миссии пройдены. Награда ожидает синхронизации с профилем.</p><button type="button" onClick={onRetry}>Синхронизировать награды</button></>}
    {sync.status === 'saved' && <>
      <p>Победа · пройдено миссий: {report.result.completedMissions.length}</p>
      <div className="tactical-result-counts"><span>Раундов <b>{stats?.totalRounds ?? 0}</b></span><span>Потеряно подразделений <b>{stats?.unitsLost ?? 0}</b></span><span>Выжило <b>{stats?.survivingUnits ?? 0}</b></span><span>Территорий <b>{stats?.territoriesCaptured ?? 0}</b></span></div>
      {report.reward.alreadyClaimed ? <p>Уникальная награда этой операции уже была получена ранее; повторного начисления нет.</p> : <p>Начислено опыта: <b>+{report.reward.xpGranted} XP</b></p>}
      {report.award && <p>Боевое отличие: <b>{report.award.name}</b></p>}
      {report.dossierUnlocked && <p>Историческое досье операции открыто в архиве.</p>}
      {report.rankUp && <p>Повышение ранга: <b>{report.rankUp.previous.name} → {report.rankUp.current.name}</b></p>}
      <Link to={FACTION_DETAILS.imperium.archivePath}>Открыть архив досье <span>→</span></Link>
    </>}
    <Link to={returnPath}>Вернуться к сюжетной карте <span>→</span></Link>
  </section>
}
