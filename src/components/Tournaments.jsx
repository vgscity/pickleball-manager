import { useState } from 'react'
import { Trophy, Plus, ChevronDown, ChevronUp, Shuffle, Check, X, Users, LayoutGrid, Swords, Crown } from 'lucide-react'
import { genId, generateRoundRobin, generateSingleElimination, generateDoubles, generateGroupStageRoundRobin } from '../utils'

// Compute standings for a set of matches
function computeStandings(matchList) {
  const map = {}
  matchList.forEach(m => {
    if (!map[m.player1.id]) map[m.player1.id] = { player: m.player1, w: 0, l: 0, d: 0, pts: 0, pf: 0, pa: 0 }
    if (!map[m.player2.id]) map[m.player2.id] = { player: m.player2, w: 0, l: 0, d: 0, pts: 0, pf: 0, pa: 0 }
    if (m.status === 'done') {
      const s1 = parseInt(m.score1) || 0
      const s2 = parseInt(m.score2) || 0
      map[m.player1.id].pf += s1; map[m.player1.id].pa += s2
      map[m.player2.id].pf += s2; map[m.player2.id].pa += s1
      if (m.winner === m.player1.id) { map[m.player1.id].w++; map[m.player1.id].pts += 2; map[m.player2.id].l++ }
      else if (m.winner === m.player2.id) { map[m.player2.id].w++; map[m.player2.id].pts += 2; map[m.player1.id].l++ }
      else { map[m.player1.id].d++; map[m.player1.id].pts++; map[m.player2.id].d++; map[m.player2.id].pts++ }
    }
  })
  return Object.values(map).sort((a, b) => b.pts - a.pts || b.w - a.w || (b.pf - b.pa) - (a.pf - a.pa))
}

const KNOCKOUT_ROUND_NAMES = { 1: 'Tứ kết', 2: 'Bán kết', 3: 'Chung kết' }
function getKnockoutRoundName(round, totalRounds) {
  const fromEnd = totalRounds - round
  if (fromEnd === 0) return 'Chung kết'
  if (fromEnd === 1) return 'Bán kết'
  if (fromEnd === 2) return 'Tứ kết'
  return `Vòng 1/${Math.pow(2, fromEnd)}`
}

export default function Tournaments({ tournaments, players, matches, onTournamentsChange, onMatchesChange }) {
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState(null)
  // knockoutSetup: { tournamentId, advancingIds }
  const [knockoutSetup, setKnockoutSetup] = useState(null)

  const [form, setForm] = useState({
    name: '',
    type: 'singles',
    format: 'roundrobin',
    groups: 1,
    pairingRule: 'random',
    hasKnockout: false,
    knockoutSize: 8,
    hasThirdPlace: false,
    startDate: '',
    endDate: '',
    courts: 2,
    description: '',
  })

  const handleCreate = () => {
    if (!form.name.trim()) return
    const t = { id: genId(), ...form, createdAt: new Date().toISOString(), status: 'setup', participants: [] }
    onTournamentsChange([...tournaments, t])
    setForm({ name: '', type: 'singles', format: 'roundrobin', groups: 1, pairingRule: 'random', hasKnockout: false, knockoutSize: 8, hasThirdPlace: false, startDate: '', endDate: '', courts: 2, description: '' })
    setShowForm(false)
  }

  const handleDeleteTournament = (id) => {
    if (!confirm('Xóa giải đấu này?')) return
    onTournamentsChange(tournaments.filter(t => t.id !== id))
    onMatchesChange(matches.filter(m => m.tournamentId !== id))
  }

  const handleTogglePlayer = (tournamentId, playerId) => {
    onTournamentsChange(tournaments.map(t => {
      if (t.id !== tournamentId) return t
      const exists = t.participants.includes(playerId)
      return { ...t, participants: exists ? t.participants.filter(p => p !== playerId) : [...t.participants, playerId] }
    }))
  }

  const handleSelectAll = (tournamentId) => {
    onTournamentsChange(tournaments.map(t =>
      t.id === tournamentId ? { ...t, participants: players.map(p => p.id) } : t
    ))
  }

  const handleSelectNone = (tournamentId) => {
    onTournamentsChange(tournaments.map(t =>
      t.id === tournamentId ? { ...t, participants: [] } : t
    ))
  }

  const handleGenerateBracket = (t) => {
    if (t.participants.length < 2) { alert('Cần ít nhất 2 người chơi'); return }
    const participantPlayers = players.filter(p => t.participants.includes(p.id))
    const numGroups = t.format === 'roundrobin' ? (t.groups || 1) : 1
    const pairingRule = t.pairingRule || 'random'

    const newMatches = []
    let totalRounds = 0

    if (t.format === 'roundrobin' && numGroups > 1) {
      let entities = t.type === 'doubles' ? generateDoubles(participantPlayers, pairingRule) : participantPlayers
      const groupStage = generateGroupStageRoundRobin(entities, numGroups, pairingRule)
      groupStage.forEach(({ label, rounds }) => {
        if (rounds.length > totalRounds) totalRounds = rounds.length
        rounds.forEach((round, ri) => {
          round.forEach((pair, pi) => {
            newMatches.push({
              id: genId(), tournamentId: t.id, stage: 'group',
              group: label, round: ri + 1, matchNum: pi + 1,
              player1: pair.player1, player2: pair.player2,
              score1: '', score2: '', winner: null,
              scheduledTime: null, court: null, status: 'pending',
            })
          })
        })
      })
      onMatchesChange([...matches.filter(m => m.tournamentId !== t.id), ...newMatches])
      onTournamentsChange(tournaments.map(x =>
        x.id === t.id ? { ...x, status: 'active', rounds: totalRounds, numGroups } : x
      ))
    } else {
      let entities = t.type === 'doubles' ? generateDoubles(participantPlayers, pairingRule) : participantPlayers
      let rounds = t.format === 'roundrobin'
        ? generateRoundRobin(entities)
        : generateSingleElimination(entities)
      rounds.forEach((round, ri) => {
        round.forEach((pair, pi) => {
          newMatches.push({
            id: genId(), tournamentId: t.id, stage: 'group',
            group: null, round: ri + 1, matchNum: pi + 1,
            player1: pair.player1, player2: pair.player2,
            score1: '', score2: '', winner: null,
            scheduledTime: null, court: null, status: 'pending',
          })
        })
      })
      onMatchesChange([...matches.filter(m => m.tournamentId !== t.id), ...newMatches])
      onTournamentsChange(tournaments.map(x =>
        x.id === t.id ? { ...x, status: 'active', rounds: rounds.length, numGroups: 1 } : x
      ))
    }
  }

  // Auto-suggest who advances to knockout based on group standings
  const suggestAdvancing = (t, tMatches, knockoutSize) => {
    const groupLabels = [...new Set(tMatches.filter(m => m.stage === 'group').map(m => m.group).filter(Boolean))].sort()
    if (!groupLabels.length) {
      // No groups — take top N from overall standings
      const standings = computeStandings(tMatches.filter(m => m.stage === 'group'))
      return standings.slice(0, knockoutSize).map(s => s.player.id)
    }
    // Distribute slots across groups
    const slotsPerGroup = Math.floor(knockoutSize / groupLabels.length)
    const extra = knockoutSize % groupLabels.length
    const advancing = []
    groupLabels.forEach((gl, i) => {
      const gMatches = tMatches.filter(m => m.group === gl && m.stage === 'group')
      const standings = computeStandings(gMatches)
      const slots = slotsPerGroup + (i < extra ? 1 : 0)
      standings.slice(0, slots).forEach(s => advancing.push(s.player.id))
    })
    // Fill remaining with best runners-up if needed
    if (advancing.length < knockoutSize) {
      const allStandings = computeStandings(tMatches.filter(m => m.stage === 'group'))
      allStandings.forEach(s => {
        if (advancing.length < knockoutSize && !advancing.includes(s.player.id)) {
          advancing.push(s.player.id)
        }
      })
    }
    return advancing
  }

  const handleOpenKnockoutSetup = (t) => {
    const tMatches = matches.filter(m => m.tournamentId === t.id && m.stage === 'group')
    const suggested = suggestAdvancing(t, tMatches, t.knockoutSize || 8)
    setKnockoutSetup({ tournamentId: t.id, advancingIds: suggested })
  }

  const handleGenerateKnockout = (t) => {
    if (!knockoutSetup) return
    const { advancingIds } = knockoutSetup
    const knockoutSize = t.knockoutSize || 8
    if (advancingIds.length < 2) { alert('Cần ít nhất 2 người'); return }

    // Get player objects — prefer from existing matches, fallback to players list
    const allPlayers = [...players]
    const tMatches = matches.filter(m => m.tournamentId === t.id)
    tMatches.forEach(m => {
      if (!allPlayers.find(p => p.id === m.player1.id)) allPlayers.push(m.player1)
      if (!allPlayers.find(p => p.id === m.player2.id)) allPlayers.push(m.player2)
    })

    const advancingPlayers = advancingIds
      .map(id => allPlayers.find(p => p.id === id))
      .filter(Boolean)

    const bracket = generateSingleElimination(advancingPlayers)
    const newKnockoutMatches = []
    bracket.forEach((round, ri) => {
      round.forEach((pair, pi) => {
        newKnockoutMatches.push({
          id: genId(), tournamentId: t.id, stage: 'knockout',
          group: null, round: ri + 1, matchNum: pi + 1,
          player1: pair.player1, player2: pair.player2,
          score1: '', score2: '', winner: null,
          scheduledTime: null, court: null, status: 'pending',
        })
      })
    })

    const existingNonKnockout = matches.filter(m => m.tournamentId !== t.id || m.stage !== 'knockout')
    onMatchesChange([...existingNonKnockout, ...newKnockoutMatches])
    onTournamentsChange(tournaments.map(x =>
      x.id === t.id ? { ...x, knockoutRounds: bracket.length } : x
    ))
    setKnockoutSetup(null)
  }

  const handleGenerateThirdPlace = (t) => {
    const isKnockoutStage = t.format === 'roundrobin' && t.hasKnockout
    const stage = isKnockoutStage ? 'knockout' : 'group'
    const totalRounds = isKnockoutStage ? (t.knockoutRounds || 3) : (t.rounds || 3)
    const semiFinalRound = totalRounds - 1

    const stageMatches = matches.filter(m => m.tournamentId === t.id && m.stage === stage)
    const semis = stageMatches.filter(m => m.round === semiFinalRound && m.status === 'done')

    if (semis.length < 2) { alert('Cần hoàn thành 2 trận bán kết trước'); return }

    const losers = semis.map(m => m.winner === m.player1.id ? m.player2 : m.player1)
    onMatchesChange([...matches, {
      id: genId(), tournamentId: t.id, stage: 'thirdplace',
      group: null, round: totalRounds, matchNum: 1,
      player1: losers[0], player2: losers[1],
      score1: '', score2: '', winner: null,
      scheduledTime: null, court: null, status: 'pending',
    }])
  }

  const handleUpdateScore = (matchId, field, value) => {
    onMatchesChange(matches.map(m => {
      if (m.id !== matchId) return m
      const updated = { ...m, [field]: value }
      if (updated.score1 !== '' && updated.score2 !== '') {
        const s1 = parseInt(updated.score1) || 0
        const s2 = parseInt(updated.score2) || 0
        updated.winner = s1 > s2 ? updated.player1.id : s2 > s1 ? updated.player2.id : null
        updated.status = 'done'
      }
      return updated
    }))
  }

  const statusBadge = { setup: 'bg-gray-100 text-gray-600', active: 'bg-blue-100 text-blue-700', finished: 'bg-green-100 text-green-700' }
  const statusLabel = { setup: 'Chuẩn bị', active: 'Đang diễn ra', finished: 'Kết thúc' }
  const groupColors = {
    A: 'bg-blue-50 border-blue-200 text-blue-800',
    B: 'bg-green-50 border-green-200 text-green-800',
    C: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    D: 'bg-purple-50 border-purple-200 text-purple-800',
    E: 'bg-pink-50 border-pink-200 text-pink-800',
    F: 'bg-orange-50 border-orange-200 text-orange-800',
    G: 'bg-teal-50 border-teal-200 text-teal-800',
    H: 'bg-red-50 border-red-200 text-red-800',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-yellow-500" />
          <h2 className="text-xl font-bold text-gray-800">Giải đấu</h2>
          <span className="bg-yellow-100 text-yellow-700 text-sm px-2 py-0.5 rounded-full font-medium">{tournaments.length} giải</span>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Tạo giải đấu
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-yellow-200 rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-3">Tạo giải đấu mới</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Tên giải đấu *</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Giải Pickleball CLB Tháng 4/2026" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Thể loại</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="singles">Đơn (Singles)</option>
                <option value="doubles">Đôi (Doubles)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Thể thức</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={form.format} onChange={e => setForm({ ...form, format: e.target.value, groups: 1, hasKnockout: false, hasThirdPlace: false })}>
                <option value="roundrobin">Vòng tròn (Round Robin)</option>
                <option value="elimination">Loại trực tiếp (Elimination)</option>
              </select>
              {form.format === 'elimination' && (
                <label className="flex items-center gap-2 cursor-pointer select-none p-2.5 mt-2 rounded-xl border border-gray-200 hover:border-yellow-300 transition-colors">
                  <input type="checkbox" className="w-4 h-4 accent-yellow-500"
                    checked={form.hasThirdPlace}
                    onChange={e => setForm({ ...form, hasThirdPlace: e.target.checked })} />
                  <div>
                    <div className="text-sm font-medium text-gray-800">🥉 Có trận tranh hạng 3</div>
                    <div className="text-xs text-gray-500">Hai người thua bán kết đấu với nhau</div>
                  </div>
                </label>
              )}
            </div>
            {form.format === 'roundrobin' && (<>
              <div>
                <label className="text-xs text-gray-500 font-medium flex items-center gap-1"><LayoutGrid size={12} /> Số bảng</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  value={form.groups} onChange={e => setForm({ ...form, groups: parseInt(e.target.value) })}>
                  {[1,2,3,4,5,6,7,8].map(n => (
                    <option key={n} value={n}>{n === 1 ? '1 bảng (toàn bộ)' : `${n} bảng (A–${'ABCDEFGH'[n-1]})`}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer select-none p-3 rounded-xl border border-gray-200 hover:border-yellow-300 transition-colors">
                  <input type="checkbox" className="w-4 h-4 accent-yellow-500"
                    checked={form.hasKnockout}
                    onChange={e => setForm({ ...form, hasKnockout: e.target.checked })} />
                  <div>
                    <div className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                      <Swords size={14} className="text-orange-500" /> Có vòng loại trực tiếp sau vòng bảng
                    </div>
                    <div className="text-xs text-gray-500">Tứ kết / Bán kết / Chung kết sau khi đánh xong bảng</div>
                  </div>
                </label>
              </div>
              {form.hasKnockout && (<>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Số người vào vòng loại trực tiếp</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    value={form.knockoutSize} onChange={e => setForm({ ...form, knockoutSize: parseInt(e.target.value) })}>
                    <option value={4}>4 người (Bán kết → Chung kết)</option>
                    <option value={8}>8 người (Tứ kết → Bán kết → Chung kết)</option>
                    <option value={16}>16 người (Vòng 1/8 → ... → Chung kết)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none p-3 rounded-xl border border-gray-200 hover:border-yellow-300 transition-colors">
                    <input type="checkbox" className="w-4 h-4 accent-yellow-500"
                      checked={form.hasThirdPlace}
                      onChange={e => setForm({ ...form, hasThirdPlace: e.target.checked })} />
                    <div>
                      <div className="text-sm font-medium text-gray-800">🥉 Có trận tranh hạng 3</div>
                      <div className="text-xs text-gray-500">Hai người thua bán kết đấu với nhau</div>
                    </div>
                  </label>
                </div>
              </>)}
            </>)}
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Luật ghép cặp theo trình độ</label>
              <div className="mt-1 space-y-1.5">
                {[
                  { value: 'random',    label: '🎲 Ngẫu nhiên',    desc: 'Trộn tất cả, bốc thăm' },
                  { value: 'mixed',     label: '⚖️ Trộn A + B',    desc: 'Mỗi bảng/cặp có cả A và B cân bằng' },
                  { value: 'separated', label: '🏅 Tách trình độ', desc: 'A chơi với A, B chơi với B' },
                ].map(opt => (
                  <label key={opt.value} className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${form.pairingRule === opt.value ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300'}`}>
                    <input type="radio" name="pairingRule" value={opt.value}
                      checked={form.pairingRule === opt.value}
                      onChange={() => setForm({ ...form, pairingRule: opt.value })}
                      className="mt-0.5 accent-yellow-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-800">{opt.label}</div>
                      <div className="text-xs text-gray-500">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Ngày bắt đầu</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Ngày kết thúc</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Số sân</label>
              <input type="number" min="1" max="10" className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={form.courts} onChange={e => setForm({ ...form, courts: parseInt(e.target.value) || 1 })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Mô tả</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Ghi chú thêm..." value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleCreate} className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Check size={14} /> Tạo
            </button>
            <button onClick={() => setShowForm(false)} className="flex items-center gap-1 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm text-gray-600">
              <X size={14} /> Hủy
            </button>
          </div>
        </div>
      )}

      {tournaments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Trophy size={40} className="mx-auto mb-2 opacity-30" />
          <p>Chưa có giải đấu nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map(t => {
            const tMatches = matches.filter(m => m.tournamentId === t.id)
            const groupMatches = tMatches.filter(m => m.stage === 'group' || !m.stage)
            const knockoutMatches = tMatches.filter(m => m.stage === 'knockout')
            const thirdPlaceMatches = tMatches.filter(m => m.stage === 'thirdplace')
            const doneCount = tMatches.filter(m => m.status === 'done').length
            const isExpanded = expanded === t.id
            const numGroups = t.numGroups || 1
            const groupLabels = [...new Set(groupMatches.map(m => m.group).filter(Boolean))].sort()
            const hasGroups = groupLabels.length > 0
            const groupStageDone = groupMatches.length > 0 && groupMatches.every(m => m.status === 'done')
            const hasKnockoutMatches = knockoutMatches.length > 0
            const isKnockoutSetupOpen = knockoutSetup?.tournamentId === t.id

            // Get all player objects from matches for knockout setup
            const allMatchPlayers = {}
            tMatches.forEach(m => { allMatchPlayers[m.player1.id] = m.player1; allMatchPlayers[m.player2.id] = m.player2 })

            return (
              <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : t.id)}>
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                    <Trophy size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 truncate">{t.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-2">
                      <span>{t.type === 'singles' ? 'Đơn' : 'Đôi'} · {t.format === 'roundrobin' ? 'Vòng tròn' : 'Loại trực tiếp'}</span>
                      {numGroups > 1 && <span className="text-yellow-600 font-medium">{numGroups} bảng</span>}
                      {t.hasKnockout && <span className="text-orange-600">+ Loại trực tiếp</span>}
                      {t.pairingRule === 'mixed' && <span className="text-purple-600">⚖️ Trộn A+B</span>}
                      {t.pairingRule === 'separated' && <span className="text-blue-600">🏅 Tách trình độ</span>}
                      {t.startDate && <span>{t.startDate}</span>}
                      <span>{t.participants.length} người</span>
                      {tMatches.length > 0 && <span>{doneCount}/{tMatches.length} trận</span>}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusBadge[t.status]}`}>
                    {statusLabel[t.status]}
                  </span>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    {/* Participant selection */}
                    <div>
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                          <Users size={14} /> Người tham gia ({t.participants.length})
                        </h4>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleSelectAll(t.id)} className="text-xs text-blue-600 hover:underline">Chọn tất cả</button>
                          <button onClick={() => handleSelectNone(t.id)} className="text-xs text-gray-400 hover:underline">Bỏ chọn</button>
                          <button onClick={() => handleGenerateBracket(t)}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                            <Shuffle size={13} /> Chia cặp & Tạo bảng
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {players.map(p => {
                          const sel = t.participants.includes(p.id)
                          return (
                            <button key={p.id} onClick={() => handleTogglePlayer(t.id, p.id)}
                              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${sel ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}>
                              {sel && <Check size={10} className="inline mr-1" />}
                              {p.name} <span className="opacity-60">{p.level}</span>
                            </button>
                          )
                        })}
                        {players.length === 0 && <p className="text-xs text-gray-400">Chưa có thành viên.</p>}
                      </div>
                    </div>

                    {/* Group stage matches */}
                    {groupMatches.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm text-gray-700">
                            Vòng bảng ({groupMatches.length} trận)
                            {groupStageDone && <span className="ml-2 text-xs text-green-600 font-normal">✓ Hoàn thành</span>}
                          </h4>
                        </div>
                        {hasGroups ? (
                          <div className="space-y-4">
                            {groupLabels.map(gl => {
                              const gMatches = groupMatches.filter(m => m.group === gl)
                              const roundNums = [...new Set(gMatches.map(m => m.round))].sort((a,b)=>a-b)
                              const colorCls = groupColors[gl] || 'bg-gray-50 border-gray-200 text-gray-800'
                              const gPlayers = [...new Set([...gMatches.map(m=>m.player1.name),...gMatches.map(m=>m.player2.name)])]
                              return (
                                <div key={gl} className={`rounded-xl border p-3 ${colorCls}`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-7 h-7 rounded-lg bg-white bg-opacity-60 flex items-center justify-center font-black text-sm">{gl}</div>
                                    <span className="font-semibold text-sm">Bảng {gl}</span>
                                    <span className="text-xs opacity-70">· {gPlayers.length} người · {gMatches.length} trận</span>
                                    <span className="text-xs opacity-70 ml-auto">{gMatches.filter(m=>m.status==='done').length}/{gMatches.length} xong</span>
                                  </div>
                                  <GroupStandings matches={gMatches} />
                                  {roundNums.map(rn => (
                                    <div key={rn} className="mt-2">
                                      <div className="text-xs font-semibold opacity-60 mb-1 uppercase tracking-wide">Lượt {rn}</div>
                                      <div className="space-y-1.5">
                                        {gMatches.filter(m=>m.round===rn).map(m => (
                                          <MatchRow key={m.id} match={m} onUpdate={handleUpdateScore} />
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {Array.from({ length: t.rounds || 1 }, (_, ri) => {
                              const roundMatches = groupMatches.filter(m => m.round === ri + 1)
                              if (!roundMatches.length) return null
                              return (
                                <div key={ri}>
                                  <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                    {t.format === 'elimination'
                                      ? getKnockoutRoundName(ri + 1, t.rounds)
                                      : `Lượt ${ri + 1}`}
                                  </div>
                                  <div className="space-y-1.5">
                                    {roundMatches.map(m => <MatchRow key={m.id} match={m} onUpdate={handleUpdateScore} />)}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Knockout stage trigger */}
                    {t.hasKnockout && groupMatches.length > 0 && !hasKnockoutMatches && (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <div className="font-semibold text-sm text-orange-800 flex items-center gap-1.5">
                              <Swords size={14} /> Vòng loại trực tiếp ({t.knockoutSize || 8} người)
                            </div>
                            <div className="text-xs text-orange-600 mt-0.5">
                              {groupStageDone ? 'Vòng bảng xong — sẵn sàng tạo vòng loại' : 'Có thể tạo trước khi vòng bảng kết thúc'}
                            </div>
                          </div>
                          <button onClick={() => handleOpenKnockoutSetup(t)}
                            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-xs font-medium">
                            <Swords size={13} /> Chọn người vào vòng loại
                          </button>
                        </div>

                        {/* Knockout setup panel */}
                        {isKnockoutSetupOpen && (
                          <div className="mt-3 bg-white rounded-lg border border-orange-200 p-3">
                            <div className="font-medium text-sm text-gray-700 mb-2">
                              Chọn {t.knockoutSize || 8} người vào vòng loại
                              <span className="ml-2 text-xs text-gray-400">
                                ({knockoutSetup.advancingIds.length}/{t.knockoutSize || 8} đã chọn)
                              </span>
                            </div>
                            {/* Show by group */}
                            {groupLabels.length > 0 ? groupLabels.map(gl => {
                              const gMatches = groupMatches.filter(m => m.group === gl)
                              const standings = computeStandings(gMatches)
                              return (
                                <div key={gl} className="mb-3">
                                  <div className="text-xs font-semibold text-gray-500 mb-1">Bảng {gl}</div>
                                  <div className="space-y-1">
                                    {standings.map((s, i) => {
                                      const isSelected = knockoutSetup.advancingIds.includes(s.player.id)
                                      return (
                                        <label key={s.player.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs border transition-colors ${isSelected ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 border-gray-200 hover:border-orange-200'}`}>
                                          <input type="checkbox" className="accent-orange-500"
                                            checked={isSelected}
                                            onChange={() => {
                                              const ids = knockoutSetup.advancingIds
                                              setKnockoutSetup({
                                                ...knockoutSetup,
                                                advancingIds: isSelected ? ids.filter(id => id !== s.player.id) : [...ids, s.player.id]
                                              })
                                            }} />
                                          <span className="font-semibold w-4 text-gray-400">{i+1}.</span>
                                          <span className="font-medium text-gray-800 flex-1">{s.player.name}</span>
                                          <span className="text-gray-500">{s.w}T/{s.l}B</span>
                                          <span className="font-bold text-orange-700">{s.pts}đ</span>
                                        </label>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            }) : (
                              // No groups
                              <div className="space-y-1">
                                {computeStandings(groupMatches).map((s, i) => {
                                  const isSelected = knockoutSetup.advancingIds.includes(s.player.id)
                                  return (
                                    <label key={s.player.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs border transition-colors ${isSelected ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 border-gray-200'}`}>
                                      <input type="checkbox" className="accent-orange-500"
                                        checked={isSelected}
                                        onChange={() => {
                                          const ids = knockoutSetup.advancingIds
                                          setKnockoutSetup({ ...knockoutSetup, advancingIds: isSelected ? ids.filter(id => id !== s.player.id) : [...ids, s.player.id] })
                                        }} />
                                      <span className="font-semibold w-4 text-gray-400">{i+1}.</span>
                                      <span className="font-medium text-gray-800 flex-1">{s.player.name}</span>
                                      <span className="font-bold text-orange-700">{s.pts}đ</span>
                                    </label>
                                  )
                                })}
                              </div>
                            )}
                            <div className="flex gap-2 mt-3">
                              <button onClick={() => handleGenerateKnockout(t)}
                                disabled={knockoutSetup.advancingIds.length < 2}
                                className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                <Swords size={14} /> Tạo vòng loại trực tiếp
                              </button>
                              <button onClick={() => setKnockoutSetup(null)}
                                className="border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-600">
                                Hủy
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Knockout stage matches */}
                    {hasKnockoutMatches && (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm text-orange-800 flex items-center gap-1.5">
                            <Crown size={14} /> Vòng loại trực tiếp ({knockoutMatches.length} trận)
                          </h4>
                          <button onClick={() => { if(confirm('Xóa vòng loại và tạo lại?')) { onMatchesChange(matches.filter(m => !(m.tournamentId===t.id && m.stage==='knockout'))); setKnockoutSetup(null) }}}
                            className="text-xs text-red-400 hover:text-red-600">Xóa & tạo lại</button>
                        </div>
                        <div className="space-y-3">
                          {Array.from({ length: t.knockoutRounds || 3 }, (_, ri) => {
                            const roundMatches = knockoutMatches.filter(m => m.round === ri + 1)
                            if (!roundMatches.length) return null
                            return (
                              <div key={ri}>
                                <div className="text-xs font-bold text-orange-700 mb-1.5 uppercase tracking-wide">
                                  {getKnockoutRoundName(ri + 1, t.knockoutRounds || 3)}
                                </div>
                                <div className="space-y-1.5">
                                  {roundMatches.map(m => <MatchRow key={m.id} match={m} onUpdate={handleUpdateScore} highlight />)}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Third place match */}
                    {t.hasThirdPlace && (() => {
                      const isKnockoutStage = t.format === 'roundrobin' && t.hasKnockout
                      const stage = isKnockoutStage ? 'knockout' : 'group'
                      const totalRounds = isKnockoutStage ? (t.knockoutRounds || 3) : (t.rounds || 3)
                      const semiFinalRound = totalRounds - 1
                      const stageMatches = tMatches.filter(m => m.stage === stage)
                      const semis = stageMatches.filter(m => m.round === semiFinalRound)
                      const semisAllDone = semis.length >= 2 && semis.every(m => m.status === 'done')
                      return (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                            <h4 className="font-semibold text-sm text-amber-800 flex items-center gap-1.5">
                              🥉 Trận tranh hạng 3
                            </h4>
                            {thirdPlaceMatches.length === 0 && (
                              <button onClick={() => handleGenerateThirdPlace(t)}
                                disabled={!semisAllDone}
                                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                                {semisAllDone ? 'Tạo trận hạng 3' : 'Chờ bán kết xong'}
                              </button>
                            )}
                          </div>
                          {thirdPlaceMatches.length > 0
                            ? <div className="space-y-1.5">
                                {thirdPlaceMatches.map(m => <MatchRow key={m.id} match={m} onUpdate={handleUpdateScore} highlight />)}
                              </div>
                            : <p className="text-xs text-amber-600">Trận sẽ được tạo sau khi 2 trận bán kết hoàn thành.</p>
                          }
                        </div>
                      )
                    })()}

                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button onClick={() => { if(confirm('Kết thúc giải đấu này?')) onTournamentsChange(tournaments.map(x => x.id === t.id ? { ...x, status: 'finished' } : x)) }}
                        className="text-xs text-green-600 hover:text-green-800 font-medium">Đánh dấu kết thúc</button>
                      <span className="text-gray-300">|</span>
                      <button onClick={() => handleDeleteTournament(t.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Xóa giải</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function GroupStandings({ matches }) {
  const standings = computeStandings(matches)
  if (standings.every(s => s.w === 0 && s.l === 0)) return null
  return (
    <div className="bg-white bg-opacity-60 rounded-lg p-2 mb-2 text-xs">
      <div className="grid grid-cols-4 font-semibold text-gray-500 pb-1 border-b border-gray-200 mb-1">
        <span className="col-span-2">Người chơi</span>
        <span className="text-center">T/B</span>
        <span className="text-center">Điểm</span>
      </div>
      {standings.map((s, i) => (
        <div key={s.player.id} className={`grid grid-cols-4 py-0.5 ${i === 0 ? 'font-semibold text-green-700' : 'text-gray-700'}`}>
          <span className="col-span-2 truncate">{i+1}. {s.player.name}</span>
          <span className="text-center">{s.w}/{s.l}</span>
          <span className="text-center font-bold">{s.pts}</span>
        </div>
      ))}
    </div>
  )
}

function MatchRow({ match, onUpdate, highlight }) {
  const isDone = match.status === 'done'
  const winnerIsP1 = match.winner === match.player1.id
  const winnerIsP2 = match.winner === match.player2.id
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg border text-sm ${isDone ? 'bg-white bg-opacity-80 border-gray-200' : highlight ? 'bg-white border-orange-200' : 'bg-white border-gray-200'}`}>
      <span className={`flex-1 text-right truncate text-xs font-medium ${winnerIsP1 ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>
        {winnerIsP1 && '🏆 '}{match.player1.name}
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <input type="number" min="0"
          className="w-10 border border-gray-200 rounded px-1.5 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          value={match.score1} onChange={e => onUpdate(match.id, 'score1', e.target.value)} placeholder="0" />
        <span className="text-gray-400 font-bold text-xs">:</span>
        <input type="number" min="0"
          className="w-10 border border-gray-200 rounded px-1.5 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          value={match.score2} onChange={e => onUpdate(match.id, 'score2', e.target.value)} placeholder="0" />
      </div>
      <span className={`flex-1 truncate text-xs font-medium ${winnerIsP2 ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>
        {winnerIsP2 && '🏆 '}{match.player2.name}
      </span>
      {match.court && <span className="text-xs text-gray-400 shrink-0">S{match.court}</span>}
    </div>
  )
}
