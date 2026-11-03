import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import TacticalOperationHud from './TacticalOperationHud'

const territory = { planetName: 'Терра', name: 'Северный фронт' }
const mission = { name: 'Захват плацдарма', eraId: 'unification', type: 'capture', victoryConditions: { captureRounds: 2 } }

test('shows campaign context, tactical phase, current objective and force counts in the HUD', () => {
  const { container } = render(<TacticalOperationHud
    mission={mission}
    territory={territory}
    operationTitle="Пепел Терры"
    operationStep={2}
    operationTotal={7}
    phaseLabel="ПЛАНИРОВАНИЕ"
    battle={{
      round: 3,
      missionProgress: { captureRounds: 1, contested: false },
      strategicObjects: [],
      units: [
        { side: 'player', hp: 4 }, { side: 'player', hp: 0 },
        { side: 'enemy', hp: 3 },
      ],
    }}
  />)
  expect(screen.getByRole('heading', { name: 'Захват плацдарма' })).toBeInTheDocument()
  expect(screen.getByText('ОПЕРАЦИЯ · ПЕПЕЛ ТЕРРЫ')).toBeInTheDocument()
  expect(screen.getByText('03')).toBeInTheDocument()
  expect(screen.getByText('КОНТРОЛЬ ТОЧКИ · 1/2')).toBeInTheDocument()
  expect(screen.getByText('02')).toBeInTheDocument()
  expect(container.querySelector('.tactical-hud-forces b')).toHaveTextContent('1 / 1')
})
