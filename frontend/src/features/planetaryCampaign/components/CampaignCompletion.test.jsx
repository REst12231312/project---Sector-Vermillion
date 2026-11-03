import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => require('react').createElement('a', { href: to, ...props }, children),
}))

import CampaignCompletion from './CampaignCompletion'

test('does not display rewards before the server confirms the campaign', () => {
  render(<CampaignCompletion operationId="imperium-origin" returnPath="/campaign" sync={{ status: 'error', error: 'Нет связи.' }} onRetry={jest.fn()} />)
  expect(screen.getByText('Нет связи.')).toBeInTheDocument()
  expect(screen.queryByText(/начислено опыта/i)).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: /вернуться к сюжетной карте/i })).toHaveAttribute('href', '/campaign')
})

test('shows confirmed rewards and rank changes from the saved report', () => {
  const report = {
    result: { completedMissions: ['m1', 'm2'] },
    statistics: { totalRounds: 8, unitsLost: 0, survivingUnits: 3, territoriesCaptured: 2 },
    reward: { xpGranted: 100, alreadyClaimed: false },
    award: { name: 'Объединитель Терры' },
    dossierUnlocked: true,
    rankUp: { previous: { name: 'Неофит' }, current: { name: 'Боевой брат' } },
  }
  render(<CampaignCompletion operationId="imperium-origin" returnPath="/campaign" sync={{ status: 'saved', report }} />)
  expect(screen.getByText('Победа · пройдено миссий: 2')).toBeInTheDocument()
  expect(screen.getByText('Начислено опыта:')).toHaveTextContent('+100 XP')
  expect(screen.getByText(/Объединитель Терры/)).toBeInTheDocument()
  expect(screen.getByText(/Неофит → Боевой брат/)).toBeInTheDocument()
  expect(screen.getByText(/историческое досье операции открыто/i)).toBeInTheDocument()
})

test('does not show XP again when the server reports a prior claim', () => {
  render(<CampaignCompletion operationId="imperium-origin" returnPath="/campaign" sync={{ status: 'saved', report: { result: { completedMissions: [] }, statistics: {}, reward: { xpGranted: 0, alreadyClaimed: true }, dossierUnlocked: true } }} />)
  expect(screen.getByText(/уникальная награда этой операции уже была получена ранее/i)).toBeInTheDocument()
  expect(screen.queryByText(/\+0 XP/)).not.toBeInTheDocument()
})
