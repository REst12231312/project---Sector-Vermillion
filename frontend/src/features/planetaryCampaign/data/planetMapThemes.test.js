import { getPlanetMapTheme } from './planetMapThemes'

test('Terra eras use distinct surface palettes and era-specific named landmarks', () => {
  const unification = getPlanetMapTheme('terra', 'unification')
  const siege = getPlanetMapTheme('terra', 'siege')

  expect(unification.id).toBe('terra-wasteland')
  expect(unification.label).toContain('ПУСТОШИ')
  expect(unification.landmarks.map((item) => item.text)).toContain('КАРПАТСКИЙ РАЗЛОМ')
  expect(siege.id).toBe('terra-siege')
  expect(siege.style['--map-edge']).not.toBe(unification.style['--map-edge'])
  expect(siege.style['--map-surface']).not.toBe(unification.style['--map-surface'])
  expect(siege.landmarks.map((item) => item.text)).toContain('ПРОЛОМ ВОРОТ')
})
