import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import FrontlineOverlay from './FrontlineOverlay'

test('draws layered front lines with direction markers', () => {
  const { container } = render(<svg><FrontlineOverlay markerId="front-arrow" segments={[{ id: 'north|center', path: 'M 10 10 L 30 30', leftControl: 'player', rightControl: 'enemy' }]} /></svg>)
  expect(container.querySelector('.planet-frontline-underlay')).toBeInTheDocument()
  expect(container.querySelector('.planet-frontline-dashes')).toBeInTheDocument()
  expect(container.querySelector('.planet-frontline').getAttribute('marker-end')).toBe('url(#front-arrow)')
})
