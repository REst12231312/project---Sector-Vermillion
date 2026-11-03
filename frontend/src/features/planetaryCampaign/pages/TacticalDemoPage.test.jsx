import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => require('react').createElement('a', { href: to, ...props }, children),
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams()],
}))

import TacticalDemoPage from './TacticalDemoPage'

function renderPage() {
  return render(<TacticalDemoPage />)
}

test('shows a 12 by 12 field with three allied and three enemy units', () => {
  renderPage()

  expect(screen.getAllByRole('gridcell')).toHaveLength(144)
  expect(screen.getAllByRole('button').filter((button) => button.getAttribute('aria-label')?.includes('союзник'))).toHaveLength(3)
  expect(screen.getAllByRole('button').filter((button) => button.getAttribute('aria-label')?.includes('противник'))).toHaveLength(3)
})

test('selects a terrain cell and displays its zero-based coordinates', () => {
  renderPage()

  fireEvent.click(screen.getByRole('gridcell', { name: 'Клетка 5, 3: Стратегический объект' }))

  const cellPanel = screen.getByText('ВЫБРАННАЯ КЛЕТКА').parentElement
  expect(within(cellPanel).getByRole('heading', { name: '5, 3' })).toBeInTheDocument()
  expect(within(cellPanel).getByText('Стратегический объект')).toBeInTheDocument()
})

test('selects an allied unit and displays its combat stats and position', () => {
  renderPage()

  fireEvent.click(screen.getByRole('button', { name: /Штурмовой отряд, союзник/ }))

  expect(screen.getByRole('heading', { name: 'Штурмовой отряд' })).toBeInTheDocument()
  expect(screen.getByText('8/8 HP')).toBeInTheDocument()
  expect(screen.getByText('Позиция').nextElementSibling).toHaveTextContent('1, 8')
})

test('plans a move, keeps it when switching squads, and can replace it with Hold', () => {
  renderPage()

  fireEvent.click(screen.getByRole('button', { name: /Move/ }))
  fireEvent.click(screen.getByRole('gridcell', { name: 'Клетка 2, 8: Укрытие' }))
  expect(screen.getByText('Move → 2, 8 · 1 шаг.')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /Стрелковый отряд, союзник/ }))
  expect(screen.getByRole('button', { name: /Штурмовой отряд.*Move/ })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Hold/ }))
  expect(screen.getAllByRole('button', { name: /Hold/ })).toHaveLength(2)
})

test('plans an in-range attack, confirms the round without resolving it, and returns to planning', () => {
  renderPage()

  fireEvent.click(screen.getByRole('button', { name: /Тяжёлый отряд, союзник/ }))
  fireEvent.click(screen.getByRole('button', { name: /Attack/ }))
  fireEvent.click(screen.getByRole('button', { name: /Банда налётчиков, противник/ }))
  expect(screen.getByText('Атака запланирована: Банда налётчиков. Урон будет рассчитан при выполнении.')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /Подтвердить приказы/ }))
  expect(document.querySelector('.tactical-confirmed')).toHaveTextContent('Приказы подтверждены. Ожидание выполнения раунда.')
  expect(screen.getByText('1, 4')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Вернуться к планированию' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Вернуться к планированию' }))
  expect(screen.getByText('Планирование возобновлено. Назначенные приказы сохранены.')).toBeInTheDocument()
  expect(screen.getByText(/Attack → Банда налётчиков/)).toBeInTheDocument()
})

test('executes once, can skip event playback, and starts the next round with cleared orders', () => {
  renderPage()
  fireEvent.click(screen.getByRole('button', { name: /Тяжёлый отряд, союзник/ }))
  fireEvent.click(screen.getByRole('button', { name: /Attack/ }))
  fireEvent.click(screen.getByRole('button', { name: /Банда налётчиков, противник/ }))
  fireEvent.click(screen.getByRole('button', { name: /Подтвердить приказы/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Выполнить раунд' }))

  expect(screen.getByRole('button', { name: 'Пропустить анимацию' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Пропустить анимацию' }))
  expect(screen.getByRole('heading', { name: 'Бой продолжается' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Следующий раунд/ })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Следующий раунд/ }))
  expect(document.querySelector('.tactical-hud-round b')).toHaveTextContent('02')
  expect(screen.getByRole('button', { name: /Подтвердить приказы/ })).toBeInTheDocument()
})
