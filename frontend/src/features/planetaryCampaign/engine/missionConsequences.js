function chooseHealingTarget(units) {
  return units.filter((unit) => unit.side === 'player' && unit.hp > 0 && unit.hp < unit.maxHp)
    .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp) || a.hp - b.hp || a.id.localeCompare(b.id))[0] || null
}

export function applyMissionConsequences(missionConfig, consequences = []) {
  const setup = { missionId: missionConfig.id, unitHpOverrides: {}, reinforcements: missionConfig.reinforcements.map((entry) => ({ ...entry, spawnCandidates: entry.spawnCandidates.map((position) => ({ ...position })), unit: { ...entry.unit } })), appliedConsequences: [], consumedConsequenceIds: [] }
  for (const consequence of consequences.filter((item) => item.nextMissionId === missionConfig.id).sort((a, b) => a.id.localeCompare(b.id))) {
    setup.consumedConsequenceIds.push(consequence.id)
    if (consequence.type === 'heal_lowest_hp_unit') {
      const target = chooseHealingTarget(missionConfig.initialUnits)
      const actualAmount = target ? Math.min(consequence.amount, target.maxHp - target.hp) : 0
      if (target && actualAmount > 0) {
        setup.unitHpOverrides[target.id] = target.hp + actualAmount
        setup.appliedConsequences.push({ id: consequence.id, type: consequence.type, unitId: target.id, amount: actualAmount, description: `${target.name} восстановил ${actualAmount} HP.` })
      }
    }
    if (consequence.type === 'reduce_reinforcements') {
      let remaining = Math.max(0, consequence.amount)
      for (let index = setup.reinforcements.length - 1; index >= 0 && remaining > 0; index -= 1) {
        setup.reinforcements.splice(index, 1)
        remaining -= 1
      }
      const actualAmount = consequence.amount - remaining
      if (actualAmount > 0) setup.appliedConsequences.push({ id: consequence.id, type: consequence.type, amount: actualAmount, description: `Волна подкреплений сокращена на ${actualAmount}.` })
    }
  }
  return setup
}
