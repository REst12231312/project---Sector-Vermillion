import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
const mockNavigate = jest.fn()
const mockSetSearchParams = jest.fn()
const mockParams = {}
let mockLocationSearch = new URLSearchParams()
jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => require('react').createElement('a', { href: to, ...props }, children),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockLocationSearch, mockSetSearchParams],
  useParams: () => mockParams,
}))
import PlanetCampaignPage from './PlanetCampaignPage'

function renderPlanet() {
  return render(<PlanetCampaignPage />)
}

beforeEach(() => { localStorage.clear(); mockNavigate.mockClear(); mockSetSearchParams.mockClear(); mockLocationSearch = new URLSearchParams(); Object.keys(mockParams).forEach((key) => delete mockParams[key]) })

test('direct access to a hidden era stays neutral and does not render its archive entry or territories', () => {
  mockParams.planetId = 'terra'
  mockParams.eraId = 'siege'
  renderPlanet()
  expect(screen.getByRole('heading', { name: 'Эта кампания пока недоступна' })).toBeInTheDocument()
  expect(screen.queryByText('Осада Терры')).not.toBeInTheDocument()
  expect(screen.queryByText('Внешние рубежи дворца')).not.toBeInTheDocument()
})

test('a real completed story operation unlocks the era and its first discovery notification is shown once', async () => {
  localStorage.setItem('sv-progress', JSON.stringify({ completedLevels: ['siege-terra-loyalist'] }))
  const first = renderPlanet()
  expect(await screen.findByRole('dialog')).toBeInTheDocument()
  expect(within(screen.getByRole('dialog')).getByRole('heading', { name: 'Осада Терры' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть уведомление' }))
  fireEvent.click(screen.getByText(/Хроника Терры/))
  expect(screen.getByRole('link', { name: 'Открыть эпоху: Осада Терры' })).toBeInTheDocument()
  first.unmount()
  renderPlanet()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  fireEvent.click(screen.getByText(/Хроника Терры/))
  expect(screen.getByRole('link', { name: 'Открыть эпоху: Осада Терры' })).toBeInTheDocument()
})

test('renders five fixed sectors and selects an operation without launching it', () => {
  renderPlanet()
  expect(screen.getByRole('region', { name: 'Сводка планетарной операции' })).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Прогресс операций: 0 из 7' })).toHaveAttribute('aria-valuemax', '7')
  expect(screen.getAllByRole('button', { name: /территория|: Противник/ })).toHaveLength(5)
  fireEvent.click(screen.getByRole('button', { name: /Северный фронт:/ }))

  expect(screen.getByRole('heading', { name: 'Северный фронт' })).toBeInTheDocument()
  expect(screen.getByText(/контроль над высотами/i)).toBeInTheDocument()
  expect(screen.getByText('3', { selector: '.planet-sector-operation-count b' })).toBeInTheDocument()
  const captureMarker = screen.getByRole('button', { name: 'Захват плацдарма: Доступна' })
  fireEvent.click(captureMarker)
  expect(screen.getByRole('heading', { name: 'Захват плацдарма' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Начать операцию/ })).toBeInTheDocument()
  expect(mockNavigate).not.toHaveBeenCalled()
  expect(document.querySelector('.planet-territory.is-selected')).toBeInTheDocument()
})

test('renders deterministic terrain and distinct visual layers for each visible era', () => {
  const { container, unmount } = renderPlanet()
  expect(container.querySelector('.planet-geography-unification')).toBeInTheDocument()
  expect(container.querySelector('.planet-surface').tagName.toLowerCase()).toBe('rect')
  expect(container.querySelector('.campaign-map-boundary')).toBeInTheDocument()
  expect(container.querySelector('.planet-globe-grid')).not.toBeInTheDocument()
  expect(container.querySelectorAll('.terrain-crater circle:first-child').length).toBeGreaterThan(0)
  expect(container.querySelector('.planet-roads path')).toBeInTheDocument()
  expect(container.querySelector('.planet-territory-pattern')).toBeInTheDocument()
  expect(container.querySelector('.planet-frontlines')).toBeInTheDocument()
  unmount()

  localStorage.setItem('sv-progress', JSON.stringify({ completedLevels: ['siege-terra-loyalist'] }))
  mockParams.eraId = 'siege'
  const siege = renderPlanet()
  expect(siege.container.querySelector('.planet-geography-siege')).toBeInTheDocument()
  expect(siege.container.querySelector('.settlement-fort')).toBeInTheDocument()
})

test('zoom stays centered, cannot zoom out beyond the full-map view, and reset keeps the selection', () => {
  renderPlanet()
  fireEvent.click(screen.getByRole('button', { name: /Северный фронт:/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Захват плацдарма: Доступна' }))
  expect(screen.getByText('100%')).toBeInTheDocument()
  const scene = document.querySelector('.planet-map-scene')
  expect(scene.getAttribute('transform')).toBe('translate(0 0) scale(1)')
  expect(screen.getByRole('button', { name: 'Отдалить карту' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Приблизить карту' }))
  expect(screen.getByText('120%')).toBeInTheDocument()
  expect(scene.getAttribute('transform')).toBe('translate(-100 -70) scale(1.2)')
  fireEvent.click(screen.getByRole('button', { name: 'Сбросить камеру' }))
  expect(screen.getByText('100%')).toBeInTheDocument()
  expect(scene.getAttribute('transform')).toBe('translate(0 0) scale(1)')
  expect(screen.getByRole('heading', { name: 'Захват плацдарма' })).toBeInTheDocument()
})

test('a pointer click on a territory selects it without starting a camera drag', () => {
  renderPlanet()
  const sector = screen.getByRole('button', { name: /Северный фронт:/ })
  const map = screen.getByRole('group', { name: 'Планетарная карта: terra' })
  map.setPointerCapture = jest.fn()
  fireEvent.pointerDown(sector, { pointerId: 5, clientX: 430, clientY: 240, button: 0 })
  fireEvent.pointerUp(sector, { pointerId: 5, clientX: 430, clientY: 240 })
  fireEvent.click(sector)
  expect(map.setPointerCapture).not.toHaveBeenCalled()
  expect(screen.getByRole('heading', { name: 'Северный фронт' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Захват плацдарма' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Захват плацдарма: Доступна' }))
  expect(screen.getByRole('heading', { name: 'Захват плацдарма' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Начать операцию/ })).toBeInTheDocument()
})

test('each unification sector has an available operation and the chosen sector determines the launch', () => {
  const { container } = renderPlanet()
  fireEvent.click(screen.getByRole('button', { name: /Центральное плато:/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Захват центрального перекрёстка: Доступна' }))
  fireEvent.click(screen.getByRole('button', { name: /Начать операцию/ }))
  expect(mockNavigate).toHaveBeenCalledWith('/tactical-demo?mission=terra-central-plateau-capture&planet=terra&era=unification&territory=terra-central-plateau')
  expect(container.querySelector('.planet-campaign-page')).toBeInTheDocument()

  mockNavigate.mockClear()
  fireEvent.click(screen.getByRole('button', { name: /Южные пространства:/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Операция у южного рубежа: Доступна' }))
  fireEvent.click(screen.getByRole('button', { name: /Начать операцию/ }))
  expect(mockNavigate).toHaveBeenCalledWith('/tactical-demo?mission=terra-southern-expanse-capture&planet=terra&era=unification&territory=terra-southern-expanse')
  mockNavigate.mockClear()
  fireEvent.click(screen.getByRole('button', { name: /Северный фронт:/ }))
  expect(screen.getByRole('heading', { name: 'Северный фронт' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Захват плацдарма: Доступна' }))
  fireEvent.click(screen.getByRole('button', { name: /Начать операцию/ }))
  expect(mockNavigate).toHaveBeenCalledWith('/tactical-demo?mission=terra-north-capture&planet=terra&era=unification&territory=terra-northern-front')
})

test('selecting an operation preserves the Imperium campaign context in the map URL', () => {
  mockLocationSearch = new URLSearchParams('operationId=imperium-origin&planetId=terra&eraId=unification&factionId=imperium&returnPath=%2Fcampaign')
  renderPlanet()
  fireEvent.click(screen.getByRole('button', { name: 'Захват плацдарма: Доступна' }))
  const [nextSearch] = mockSetSearchParams.mock.calls[mockSetSearchParams.mock.calls.length - 1]
  expect(nextSearch.get('operationId')).toBe('imperium-origin')
  expect(nextSearch.get('factionId')).toBe('imperium')
  expect(nextSearch.get('returnPath')).toBe('/campaign')
  expect(nextSearch.get('territory')).toBe('terra-northern-front')
  expect(nextSearch.get('mission')).toBe('terra-north-capture')
})

test('drag and swipe gestures cannot move the map; sector selection still works', () => {
  renderPlanet()
  const frame = document.querySelector('.planet-map-frame')
  frame.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 700 })
  const map = screen.getByRole('group', { name: 'Планетарная карта: terra' })
  const scene = map.querySelector('.planet-map-scene')
  const dispatchPointer = (type, values) => {
    const event = new Event(type, { bubbles: true })
    Object.entries(values).forEach(([key, value]) => Object.defineProperty(event, key, { value }))
    fireEvent(map, event)
  }
  dispatchPointer('pointerdown', { pointerId: 1, clientX: 500, clientY: 350, button: 0 })
  dispatchPointer('pointermove', { pointerId: 1, clientX: 400, clientY: 300 })
  dispatchPointer('pointerup', { pointerId: 1, clientX: 400, clientY: 300 })
  expect(scene.getAttribute('transform')).toBe('translate(0 0) scale(1)')
  expect(screen.queryByRole('heading', { name: 'Северный фронт' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Северный фронт:/ }))
  expect(screen.getByRole('heading', { name: 'Северный фронт' })).toBeInTheDocument()
})

test('the map can be dragged toward a sector after zooming in, without accidentally selecting it', () => {
  renderPlanet()
  const frame = document.querySelector('.planet-map-frame')
  frame.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 700 })
  const map = screen.getByRole('group', { name: 'Планетарная карта: terra' })
  map.setPointerCapture = jest.fn()
  const scene = map.querySelector('.planet-map-scene')
  fireEvent.click(screen.getByRole('button', { name: 'Приблизить карту' }))
  expect(scene.getAttribute('transform')).toBe('translate(-100 -70) scale(1.2)')

  const dispatchPointer = (type, values) => {
    const event = new Event(type, { bubbles: true })
    Object.entries(values).forEach(([key, value]) => Object.defineProperty(event, key, { value }))
    fireEvent(map, event)
  }
  dispatchPointer('pointerdown', { pointerId: 1, clientX: 500, clientY: 350, button: 0 })
  dispatchPointer('pointermove', { pointerId: 1, clientX: 600, clientY: 400 })
  dispatchPointer('pointerup', { pointerId: 1, clientX: 600, clientY: 400 })
  expect(map.setPointerCapture).toHaveBeenCalledWith(1)
  expect(scene.getAttribute('transform')).toBe('translate(0 -20) scale(1.2)')
  const sector = screen.getByRole('button', { name: /Северный фронт:/ })
  fireEvent.click(sector)
  expect(screen.queryByRole('heading', { name: 'Северный фронт' })).not.toBeInTheDocument()
  fireEvent.click(sector)
  expect(screen.getByRole('heading', { name: 'Северный фронт' })).toBeInTheDocument()
  expect(scene.getAttribute('transform')).toBe('translate(0 -20) scale(1.2)')
})
