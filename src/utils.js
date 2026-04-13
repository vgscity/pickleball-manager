export const genId = () => Math.random().toString(36).slice(2, 10)

export const formatCurrency = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

export const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const formatDateTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Round-robin pairing
export function generateRoundRobin(players) {
  const n = players.length
  const arr = [...players]
  if (n % 2 !== 0) arr.push({ id: 'bye', name: 'Nghỉ' })
  const total = arr.length
  const rounds = []
  const fixed = arr[0]
  const rotating = arr.slice(1)

  for (let r = 0; r < total - 1; r++) {
    const round = []
    const circle = [fixed, ...rotating]
    for (let i = 0; i < total / 2; i++) {
      const p1 = circle[i]
      const p2 = circle[total - 1 - i]
      if (p1.id !== 'bye' && p2.id !== 'bye') {
        round.push({ player1: p1, player2: p2 })
      }
    }
    rounds.push(round)
    rotating.push(rotating.shift())
  }
  return rounds
}

// Single elimination bracket
export function generateSingleElimination(players) {
  const shuffled = [...players].sort(() => Math.random() - 0.5)
  const size = Math.pow(2, Math.ceil(Math.log2(shuffled.length)))
  while (shuffled.length < size) shuffled.push({ id: 'bye', name: 'Nghỉ' })

  const rounds = []
  let current = shuffled
  while (current.length > 1) {
    const round = []
    for (let i = 0; i < current.length; i += 2) {
      round.push({ player1: current[i], player2: current[i + 1] })
    }
    rounds.push(round)
    current = round.map((_, i) => ({ id: `w${rounds.length}_${i}`, name: '?' }))
  }
  return rounds
}

/**
 * Distribute players into groups based on pairing rule:
 *   'random'    – shuffle randomly, then deal round-robin into groups
 *   'mixed'     – snake draft (A,B,A,B…) so each group has balanced levels
 *   'separated' – all A's fill first groups, all B's fill later groups
 */
function distributeIntoGroups(players, numGroups, pairingRule) {
  const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)
  const groups = Array.from({ length: numGroups }, () => [])

  if (pairingRule === 'separated') {
    const levelOrder = ['A', 'B', 'C']
    const byLevel = {}
    levelOrder.forEach(l => { byLevel[l] = shuffle(players.filter(p => p.level === l)) })
    const others = shuffle(players.filter(p => !levelOrder.includes(p.level)))
    const ordered = [...byLevel['A'], ...byLevel['B'], ...byLevel['C'], ...others]
    ordered.forEach((p, i) => groups[i % numGroups].push(p))
  } else if (pairingRule === 'mixed') {
    // Snake draft: sort A first, then B, alternate assignment direction per round
    const aPlayers = shuffle(players.filter(p => p.level === 'A'))
    const bPlayers = shuffle(players.filter(p => p.level === 'B'))
    const others = shuffle(players.filter(p => p.level !== 'A' && p.level !== 'B'))
    // Interleave A and B
    const interleaved = []
    const maxLen = Math.max(aPlayers.length, bPlayers.length)
    for (let i = 0; i < maxLen; i++) {
      if (i < aPlayers.length) interleaved.push(aPlayers[i])
      if (i < bPlayers.length) interleaved.push(bPlayers[i])
    }
    interleaved.push(...others)
    // Snake draft into groups
    let dir = 1, gi = 0
    interleaved.forEach(p => {
      groups[gi].push(p)
      gi += dir
      if (gi >= numGroups) { gi = numGroups - 1; dir = -1 }
      if (gi < 0) { gi = 0; dir = 1 }
    })
  } else {
    // random
    shuffle(players).forEach((p, i) => groups[i % numGroups].push(p))
  }

  return groups
}

// Group-stage round-robin with pairing rule
export function generateGroupStageRoundRobin(players, numGroups, pairingRule = 'random') {
  const groups = distributeIntoGroups(players, numGroups, pairingRule)
  const groupNames = 'ABCDEFGH'
  return groups.map((groupPlayers, gi) => ({
    label: groupNames[gi],
    players: groupPlayers,
    rounds: generateRoundRobin(groupPlayers),
  }))
}

/**
 * Generate doubles teams based on pairing rule:
 *   'random'    – shuffle and pair sequentially
 *   'mixed'     – pair each A with a B (balanced teams)
 *   'separated' – pair A-A teams and B-B teams separately
 */
export function generateDoubles(players, pairingRule = 'random') {
  const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)
  const teams = []

  if (pairingRule === 'mixed') {
    const aPlayers = shuffle(players.filter(p => p.level === 'A'))
    const bPlayers = shuffle(players.filter(p => p.level === 'B'))
    const others = shuffle(players.filter(p => p.level !== 'A' && p.level !== 'B'))
    // Pair A with B
    const minAB = Math.min(aPlayers.length, bPlayers.length)
    for (let i = 0; i < minAB; i++) {
      const p1 = aPlayers[i], p2 = bPlayers[i]
      teams.push({ id: genId(), name: `${p1.name} / ${p2.name}`, players: [p1, p2] })
    }
    // Remaining unpaired: pair among themselves
    const remaining = [...aPlayers.slice(minAB), ...bPlayers.slice(minAB), ...others]
    for (let i = 0; i + 1 < remaining.length; i += 2) {
      const p1 = remaining[i], p2 = remaining[i + 1]
      teams.push({ id: genId(), name: `${p1.name} / ${p2.name}`, players: [p1, p2] })
    }
  } else if (pairingRule === 'separated') {
    const aPlayers = shuffle(players.filter(p => p.level === 'A'))
    const bPlayers = shuffle(players.filter(p => p.level === 'B'))
    const others = shuffle(players.filter(p => p.level !== 'A' && p.level !== 'B'))
    const all = [...aPlayers, ...bPlayers, ...others]
    for (let i = 0; i + 1 < all.length; i += 2) {
      const p1 = all[i], p2 = all[i + 1]
      teams.push({ id: genId(), name: `${p1.name} / ${p2.name}`, players: [p1, p2] })
    }
  } else {
    const shuffled = shuffle(players)
    for (let i = 0; i + 1 < shuffled.length; i += 2) {
      const p1 = shuffled[i], p2 = shuffled[i + 1]
      teams.push({ id: genId(), name: `${p1.name} / ${p2.name}`, players: [p1, p2] })
    }
  }

  return teams
}
