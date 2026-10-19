import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { scrypt as scryptCallback } from 'node:crypto'

const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'sector-vermillion-accounts-'))
process.env.SECTOR_DATA_DIRECTORY = dataDirectory
delete process.env.MONGODB_URI
const storage = await import('../storage.js')
const auth = await import('../services/authService.js')
const repository = await import('../services/userRepository.js')
const scrypt = promisify(scryptCallback)

after(() => {
  delete process.env.SECTOR_DATA_DIRECTORY
  fs.rmSync(dataDirectory, { recursive: true, force: true })
})

test('account registration, bcrypt migration, refresh rotation, profile, password and match history', async () => {
  const registered = await auth.register({ username: 'Archivist_1', email: 'Pilot@Sector.test', password: 'correct-horse-41', faction: 'tau' })
  assert.equal(registered.status, 201)
  assert.equal(registered.user.username, 'archivist_1')
  assert.equal(registered.user.email, 'pilot@sector.test')
  assert.equal(registered.user.favoriteFaction, 'tau')
  assert.equal(registered.user.avatarId, 'default')
  assert.ok(registered.token)
  assert.ok(registered.refreshToken)
  const savedUser = await repository.findUserById(registered.user.id)
  assert.match(savedUser.passwordHash, /^\$2[aby]\$/)
  assert.equal(await auth.register({ username: 'archivist_1', email: 'other@sector.test', password: 'correct-horse-41', faction: 'tau' }).then((result) => result.status), 409)
  assert.equal(await auth.register({ username: 'other_user', email: 'PILOT@SECTOR.TEST', password: 'correct-horse-41', faction: 'tau' }).then((result) => result.status), 409)

  const refreshed = await auth.refreshSession(registered.refreshToken)
  assert.equal(refreshed.status, 200)
  assert.notEqual(refreshed.refreshToken, registered.refreshToken)
  assert.equal((await auth.refreshSession(registered.refreshToken)).status, 401, 'refresh token rotation invalidates the previous cookie')
  const loggedIn = await auth.login({ identifier: 'PILOT@SECTOR.TEST', password: 'correct-horse-41' })
  assert.equal(loggedIn.status, 200)

  const changed = await auth.updateProfile(registered.user.id, { username: 'field_commander', avatarId: 'skull', favoriteFaction: 'orks' })
  assert.equal(changed.status, 200)
  assert.equal(changed.user.avatarId, 'skull')
  assert.equal(changed.user.favoriteFaction, 'orks')
  assert.equal(auth.verifyToken(changed.token).sub, registered.user.id)

  const password = await auth.changePassword(registered.user.id, { currentPassword: 'correct-horse-41', newPassword: 'new-strong-password' })
  assert.equal(password.status, 200)
  assert.equal((await auth.login({ username: 'field_commander', password: 'correct-horse-41' })).status, 401)
  assert.equal((await auth.login({ username: 'field_commander', password: 'new-strong-password' })).status, 200)
  assert.equal((await auth.changePassword(registered.user.id, { currentPassword: 'bad', newPassword: 'another-strong-password' })).status, 401)

  await repository.recordMatchHistory({
    id: 'profile-history-match', status: 'finished', winnerIndex: 0, winMethod: 'surrender', winReason: 'Соперник сдался.',
    players: [{ userId: registered.user.id, username: 'field_commander', faction: 'orks' }, { userId: 'opponent', username: 'Rival', faction: 'tau' }],
    startedAt: 1_000, finishedAt: 91_000, turn: 8, mapId: 'ash-wastes', mapName: 'Пепельные Пустоши',
  })
  await repository.recordMatchHistory({ id: 'profile-history-match', status: 'finished', winnerIndex: 0, players: [{ userId: registered.user.id }, { userId: 'opponent' }] })
  const history = await repository.getMatchHistory(registered.user.id)
  const stats = await repository.getMatchStats(registered.user.id)
  assert.equal(history.length, 1, 'a finished match is written once by match id')
  assert.equal(history[0].winnerUserId, registered.user.id)
  assert.equal(history[0].mapId, 'ash-wastes')
  assert.equal(history[0].durationSeconds, 90)
  assert.deepEqual({ matches: stats.matches, wins: stats.wins, losses: stats.losses, winRate: stats.winRate, favoriteFaction: stats.favoriteFaction }, {
    matches: 1, wins: 1, losses: 0, winRate: 100, favoriteFaction: 'orks',
  })

  const salt = 'legacy-salt'
  const legacyHash = (await scrypt('legacy-password', salt, 64)).toString('hex')
  storage.createUser({ id: 'legacy-user', username: 'legacy_pilot', salt, passwordHash: legacyHash, faction: 'imperium', createdAt: new Date().toISOString() })
  const legacyLogin = await auth.login({ username: 'legacy_pilot', password: 'legacy-password' })
  assert.equal(legacyLogin.status, 200)
  const upgraded = await repository.findUserById('legacy-user')
  assert.equal(upgraded.passwordScheme, 'bcrypt')
  assert.match(upgraded.passwordHash, /^\$2[aby]\$/)
})

test('HTTP auth keeps refresh tokens in an HttpOnly cookie and rotates them', async () => {
  const { default: app } = await import('../app.js')
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const address = server.address()
  const base = `http://127.0.0.1:${address.port}/api`
  try {
    const registrationResponse = await fetch(`${base}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'http_pilot', email: 'http@sector.test', password: 'http-password-41', faction: 'imperium' }),
    })
    assert.equal(registrationResponse.status, 201)
    const registration = await registrationResponse.json()
    const initialCookie = registrationResponse.headers.get('set-cookie')
    assert.match(initialCookie, /HttpOnly/i)
    assert.match(initialCookie, /SameSite=Lax/i)
    assert.equal(registration.refreshToken, undefined, 'refresh secret must not be exposed in JSON')
    assert.ok(registration.token)

    const profileResponse = await fetch(`${base}/auth/profile`, { headers: { Authorization: `Bearer ${registration.token}` } })
    assert.equal(profileResponse.status, 200)
    assert.equal((await profileResponse.json()).user.email, 'http@sector.test')

    const refreshCookie = initialCookie.split(';')[0]
    const refreshResponse = await fetch(`${base}/auth/refresh`, { method: 'POST', headers: { Cookie: refreshCookie } })
    assert.equal(refreshResponse.status, 200)
    const refreshed = await refreshResponse.json()
    assert.ok(refreshed.token)
    const rotatedCookie = refreshResponse.headers.get('set-cookie').split(';')[0]
    assert.notEqual(rotatedCookie, refreshCookie)
    assert.equal((await fetch(`${base}/auth/refresh`, { method: 'POST', headers: { Cookie: refreshCookie } })).status, 401)

    assert.equal((await fetch(`${base}/auth/logout`, { method: 'POST', headers: { Cookie: rotatedCookie } })).status, 200)
    assert.equal((await fetch(`${base}/auth/refresh`, { method: 'POST', headers: { Cookie: rotatedCookie } })).status, 401)
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})
