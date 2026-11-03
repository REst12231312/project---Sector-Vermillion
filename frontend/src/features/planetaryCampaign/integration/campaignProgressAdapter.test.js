import { getOperationProgressStorageKey, isOperationCampaignCompleted, loadOperationProgress, mergeCampaignCompletions, recordOperationMissionResult, saveOperationProgress } from './campaignProgressAdapter'

function makeStorage() {
  const values = new Map()
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) }
}

test('pilot completion requires every mission, is idempotent, and never overwrites legacy progress', () => {
  const storage = makeStorage()
  const user = { id: 'pilot-user' }
  expect(getOperationProgressStorageKey(user)).not.toBe(getOperationProgressStorageKey({ id: 'another-user' }))
  let progress = loadOperationProgress(storage, user)
  progress = recordOperationMissionResult(progress, 'imperium-origin', ['m1', 'm2'], { resultId: 'm1-run-1', missionId: 'm1', outcome: 'victory' })
  expect(isOperationCampaignCompleted(progress, 'imperium-origin')).toBe(false)
  progress = recordOperationMissionResult(progress, 'imperium-origin', ['m1', 'm2'], { resultId: 'm2-run-1', missionId: 'm2', outcome: 'defeat' })
  expect(isOperationCampaignCompleted(progress, 'imperium-origin')).toBe(false)
  progress = recordOperationMissionResult(progress, 'imperium-origin', ['m1', 'm2'], { resultId: 'm2-run-2', missionId: 'm2', outcome: 'victory' })
  expect(isOperationCampaignCompleted(progress, 'imperium-origin')).toBe(true)
  expect(recordOperationMissionResult(progress, 'imperium-origin', ['m1', 'm2'], { resultId: 'm2-run-2', missionId: 'm2', outcome: 'victory' })).toBe(progress)
  expect(mergeCampaignCompletions(['old-legacy-operation'], progress)).toEqual(['old-legacy-operation', 'imperium-origin'])
  saveOperationProgress(progress, storage, user)
  expect(isOperationCampaignCompleted(loadOperationProgress(storage, user), 'imperium-origin')).toBe(true)
  expect(loadOperationProgress(storage, { id: 'another-user' }).operations).toEqual({})
})
