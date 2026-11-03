export function createEventFactory(round) {
  let nextId = 1
  return (type, unitIds = [], data = {}) => ({
    id: `round-${round}-event-${nextId++}`,
    round,
    type,
    unitIds: [...unitIds].sort(),
    data,
  })
}
