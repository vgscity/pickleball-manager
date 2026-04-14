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

/**
 * Double Elimination bracket generator.
 * Returns flat array of match objects with winnerNextId/loserNextId routing.
 * stages: 'winners' | 'losers' | 'grand_final' | 'grand_final_reset'
 */
export function generateDoubleElimination(players) {
  const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)
  const n = Math.pow(2, Math.ceil(Math.log2(Math.max(players.length, 2))))
  const seeded = [...shuffle(players)]
  while (seeded.length < n) seeded.push(null) // byes

  const wbRounds = Math.log2(n)           // number of WB rounds
  const lbRounds = 2 * (wbRounds - 1)    // number of LB rounds

  const mkMatch = (stage, round, matchNum) => ({
    id: genId(), stage, round, matchNum,
    player1: null, player2: null,
    score1: '', score2: '', winner: null, status: 'pending',
    winnerNextId: null, winnerNextSlot: null,
    loserNextId: null, loserNextSlot: null,
  })

  // ── Build WB matches ──────────────────────────────────────────
  const wb = [] // wb[roundIdx][matchIdx]
  for (let r = 0; r < wbRounds; r++) {
    wb[r] = []
    const count = n / Math.pow(2, r + 1)
    for (let i = 0; i < count; i++) wb[r][i] = mkMatch('winners', r + 1, i + 1)
  }

  // Seed WB Round 1
  for (let i = 0; i < wb[0].length; i++) {
    wb[0][i].player1 = seeded[i * 2] || null
    wb[0][i].player2 = seeded[i * 2 + 1] || null
    if (wb[0][i].player1 && !wb[0][i].player2) {
      wb[0][i].status = 'done'; wb[0][i].winner = wb[0][i].player1.id
    } else if (!wb[0][i].player1 && wb[0][i].player2) {
      wb[0][i].status = 'done'; wb[0][i].winner = wb[0][i].player2.id
    }
  }

  // ── Build LB matches ──────────────────────────────────────────
  const lb = [] // lb[roundIdx][matchIdx]
  for (let r = 0; r < lbRounds; r++) {
    lb[r] = []
    let count
    if (r === 0) count = n / 4  // WB1 losers play each other
    else if (r % 2 === 1) count = lb[r - 1].length  // drop round (WB losers enter)
    else count = Math.ceil(lb[r - 1].length / 2)     // consolidation
    for (let i = 0; i < count; i++) lb[r][i] = mkMatch('losers', r + 1, i + 1)
  }

  // ── Grand Final & Reset ───────────────────────────────────────
  const gf = mkMatch('grand_final', 1, 1)
  const gfr = mkMatch('grand_final_reset', 2, 1)

  // ── Wire WB routing ───────────────────────────────────────────
  // WB Round r winner → next WB round
  for (let r = 0; r < wbRounds - 1; r++) {
    for (let i = 0; i < wb[r].length; i++) {
      wb[r][i].winnerNextId = wb[r + 1][Math.floor(i / 2)].id
      wb[r][i].winnerNextSlot = (i % 2) + 1
    }
  }
  // WB Final winner → GF slot 1
  wb[wbRounds - 1][0].winnerNextId = gf.id
  wb[wbRounds - 1][0].winnerNextSlot = 1

  // WB Round 0 losers → LB Round 0 (both slots)
  for (let i = 0; i < wb[0].length; i++) {
    wb[0][i].loserNextId = lb[0][Math.floor(i / 2)].id
    wb[0][i].loserNextSlot = (i % 2) + 1
  }
  // WB Round r (r≥1, except last) losers → LB drop round
  for (let r = 1; r < wbRounds - 1; r++) {
    const lbR = 2 * r - 1
    for (let i = 0; i < wb[r].length; i++) {
      if (lb[lbR] && lb[lbR][i]) {
        wb[r][i].loserNextId = lb[lbR][i].id
        wb[r][i].loserNextSlot = 2 // WB loser fills slot 2, LB survivor fills slot 1
      }
    }
  }
  // WB Final loser → last LB drop round slot 2
  wb[wbRounds - 1][0].loserNextId = lb[lbRounds - 1][0].id
  wb[wbRounds - 1][0].loserNextSlot = 2

  // ── Wire LB routing ───────────────────────────────────────────
  for (let r = 0; r < lbRounds - 1; r++) {
    for (let i = 0; i < lb[r].length; i++) {
      let nextIdx, slot
      if (r % 2 === 0) {
        // After even round → next drop round: 1-to-1, slot 1
        nextIdx = i; slot = 1
      } else {
        // After odd round → consolidation: pair up
        nextIdx = Math.floor(i / 2); slot = (i % 2) + 1
      }
      if (lb[r + 1] && lb[r + 1][nextIdx]) {
        lb[r][i].winnerNextId = lb[r + 1][nextIdx].id
        lb[r][i].winnerNextSlot = slot
      }
    }
  }
  // LB Final winner → GF slot 2
  lb[lbRounds - 1][0].winnerNextId = gf.id
  lb[lbRounds - 1][0].winnerNextSlot = 2

  // GF: if LB winner (slot 2) wins → activate GFR (handled in score update)
  // GFR players are filled dynamically when GF completes

  return [...wb.flat(), ...lb.flat(), gf, gfr]
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
