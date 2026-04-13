import { useState } from 'react'
import { Trophy, Calendar, MapPin, Clock, ChevronDown, ChevronUp, Crown, Swords } from 'lucide-react'

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

function getKnockoutRoundName(round, totalRounds) {
  const fromEnd = totalRounds - round
  if (fromEnd === 0) return 'Chung kết'
  if (fromEnd === 1) return 'Bán kết'
  if (fromEnd === 2) return 'Tứ kết'
  return `Vòng 1/${Math.pow(2, fromEnd)}`
}

const groupColors = {
  A: { bg: 'bg-blue-600', light: 'bg-blue-50 border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  B: { bg: 'bg-green-600', light: 'bg-green-50 border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  C: { bg: 'bg-yellow-500', light: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
  D: { bg: 'bg-purple-600', light: 'bg-purple-50 border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  E: { bg: 'bg-pink-500', light: 'bg-pink-50 border-pink-200', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-700' },
  F: { bg: 'bg-orange-500', light: 'bg-orange-50 border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  G: { bg: 'bg-teal-500', light: 'bg-teal-50 border-teal-200', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-700' },
  H: { bg: 'bg-red-500', light: 'bg-red-50 border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
}

export default function ViewerApp({ data }) {
  const { tournaments, matches, settings } = data
  const clubName = settings?.clubName || 'Pickleball CLB'
  const logoEmoji = settings?.logoEmoji || '🏓'
  const logoUrl = settings?.logoUrl || ''
  const [activeTab, setActiveTab] = useState('brackets')
  const [expandedTournament, setExpandedTournament] = useState(
    tournaments.find(t => t.status === 'active')?.id || tournaments[0]?.id || null
  )

  const activeTournaments = tournaments.filter(t => t.status !== 'setup')

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {logoUrl
              ? <img src={logoUrl} alt="logo" className="w-9 h-9 rounded-xl object-cover border border-gray-600" />
              : <div className="w-9 h-9 bg-green-700 rounded-xl flex items-center justify-center text-xl font-black">{logoEmoji}</div>
            }
            <div>
              <div className="font-black text-white text-base leading-tight">{clubName}</div>
              <div className="text-xs text-gray-400">Bảng kết quả trực tiếp</div>
            </div>
          </div>
          <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('brackets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'brackets' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Trophy size={15} /> Bảng đấu
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'schedule' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Calendar size={15} /> Lịch thi đấu
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-5">
        {activeTournaments.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Trophy size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-lg">Chưa có giải đấu nào</p>
          </div>
        ) : (
          <>
            {activeTab === 'brackets' && (
              <BracketsView
                tournaments={activeTournaments}
                matches={matches}
                expandedTournament={expandedTournament}
                setExpandedTournament={setExpandedTournament}
              />
            )}
            {activeTab === 'schedule' && (
              <ScheduleView
                tournaments={activeTournaments}
                matches={matches}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function BracketsView({ tournaments, matches, expandedTournament, setExpandedTournament }) {
  return (
    <div className="space-y-3">
      {tournaments.map(t => {
        const tMatches = matches.filter(m => m.tournamentId === t.id)
        const groupMatches = tMatches.filter(m => m.stage === 'group' || !m.stage)
        const knockoutMatches = tMatches.filter(m => m.stage === 'knockout')
        const groupLabels = [...new Set(groupMatches.map(m => m.group).filter(Boolean))].sort()
        const hasGroups = groupLabels.length > 0
        const isOpen = expandedTournament === t.id
        const done = tMatches.filter(m => m.status === 'done').length

        return (
          <div key={t.id} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
            {/* Tournament header */}
            <button
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-750 transition-colors text-left"
              onClick={() => setExpandedTournament(isOpen ? null : t.id)}
            >
              <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-black font-black">
                <Trophy size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">{t.name}</div>
                <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-2">
                  <span>{t.type === 'singles' ? 'Đơn' : 'Đôi'}</span>
                  {t.numGroups > 1 && <span>{t.numGroups} bảng</span>}
                  {t.hasKnockout && <span className="text-orange-400">+ Loại trực tiếp</span>}
                  {tMatches.length > 0 && <span className="text-green-400">{done}/{tMatches.length} trận</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {t.status === 'active' && (
                  <span className="flex items-center gap-1 text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    Live
                  </span>
                )}
                {t.status === 'finished' && (
                  <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded-full">Kết thúc</span>
                )}
                {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-700 p-4 space-y-5">
                {/* Group stage */}
                {groupMatches.length > 0 && (
                  <div>
                    {hasGroups ? (
                      <div className="space-y-4">
                        {groupLabels.map(gl => {
                          const gMatches = groupMatches.filter(m => m.group === gl)
                          const standings = computeStandings(gMatches)
                          const colors = groupColors[gl] || groupColors.A
                          const roundNums = [...new Set(gMatches.map(m => m.round))].sort((a, b) => a - b)

                          return (
                            <div key={gl}>
                              {/* Group header */}
                              <div className={`${colors.bg} rounded-t-xl px-4 py-2.5 flex items-center gap-2`}>
                                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-lg flex items-center justify-center font-black text-sm">{gl}</div>
                                <span className="font-bold text-white">Bảng {gl}</span>
                                <span className="text-xs text-white text-opacity-70 ml-auto">
                                  {gMatches.filter(m => m.status === 'done').length}/{gMatches.length} trận
                                </span>
                              </div>

                              {/* Standings table */}
                              <div className="bg-gray-750 border border-gray-700 rounded-b-xl overflow-hidden mb-3">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-gray-700 text-gray-300 text-xs">
                                      <th className="text-left px-3 py-2 font-semibold">#</th>
                                      <th className="text-left px-3 py-2 font-semibold">Người chơi</th>
                                      <th className="text-center px-2 py-2 font-semibold">T</th>
                                      <th className="text-center px-2 py-2 font-semibold">B</th>
                                      <th className="text-center px-2 py-2 font-semibold">HS</th>
                                      <th className="text-center px-3 py-2 font-semibold">Điểm</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {standings.map((s, i) => (
                                      <tr key={s.player.id} className={`border-t border-gray-700 ${i === 0 ? 'bg-gray-700' : 'bg-gray-800'}`}>
                                        <td className="px-3 py-2.5">
                                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-gray-500 text-xs">{i+1}</span>}
                                        </td>
                                        <td className="px-3 py-2.5 font-medium text-white">{s.player.name}</td>
                                        <td className="px-2 py-2.5 text-center text-green-400 font-bold">{s.w}</td>
                                        <td className="px-2 py-2.5 text-center text-red-400 font-bold">{s.l}</td>
                                        <td className="px-2 py-2.5 text-center text-gray-400 text-xs">{s.pf}-{s.pa}</td>
                                        <td className="px-3 py-2.5 text-center">
                                          <span className={`font-black text-sm ${i === 0 ? 'text-yellow-400' : 'text-gray-300'}`}>{s.pts}</span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Match results in this group */}
                              <div className="space-y-1.5">
                                {roundNums.map(rn => (
                                  <div key={rn}>
                                    <div className="text-xs text-gray-500 font-medium mb-1 px-1">Lượt {rn}</div>
                                    {gMatches.filter(m => m.round === rn).map(m => (
                                      <ViewerMatchRow key={m.id} match={m} />
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      // Single group / no groups
                      <div>
                        <div className="font-semibold text-gray-300 text-sm mb-3">Bảng xếp hạng</div>
                        <StandingsTable standings={computeStandings(groupMatches)} />
                        <div className="mt-3 space-y-1.5">
                          {Array.from({ length: t.rounds || 1 }, (_, ri) => {
                            const rms = groupMatches.filter(m => m.round === ri + 1)
                            if (!rms.length) return null
                            return (
                              <div key={ri}>
                                <div className="text-xs text-gray-500 font-medium mb-1 px-1">Lượt {ri + 1}</div>
                                {rms.map(m => <ViewerMatchRow key={m.id} match={m} />)}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Knockout stage */}
                {knockoutMatches.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Crown size={16} className="text-yellow-400" />
                      <span className="font-bold text-yellow-400 text-sm">Vòng loại trực tiếp</span>
                    </div>
                    <div className="space-y-4">
                      {Array.from({ length: t.knockoutRounds || 3 }, (_, ri) => {
                        const rms = knockoutMatches.filter(m => m.round === ri + 1)
                        if (!rms.length) return null
                        const roundName = getKnockoutRoundName(ri + 1, t.knockoutRounds || 3)
                        const isFinal = ri === (t.knockoutRounds || 3) - 1
                        return (
                          <div key={ri}>
                            <div className={`text-xs font-bold mb-2 px-1 uppercase tracking-widest ${isFinal ? 'text-yellow-400' : 'text-orange-400'}`}>
                              {isFinal ? '🏆 ' : ''}{roundName}
                            </div>
                            <div className="space-y-1.5">
                              {rms.map(m => <ViewerMatchRow key={m.id} match={m} highlight={isFinal} />)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {tMatches.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">Chưa có trận đấu nào</div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StandingsTable({ standings }) {
  if (!standings.length) return null
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-700 text-gray-300 text-xs">
            <th className="text-left px-3 py-2">#</th>
            <th className="text-left px-3 py-2">Người chơi</th>
            <th className="text-center px-2 py-2">T</th>
            <th className="text-center px-2 py-2">B</th>
            <th className="text-center px-2 py-2">HS</th>
            <th className="text-center px-3 py-2">Điểm</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => (
            <tr key={s.player.id} className={`border-t border-gray-700 ${i === 0 ? 'bg-gray-700' : ''}`}>
              <td className="px-3 py-2.5">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-gray-500 text-xs">{i+1}</span>}</td>
              <td className="px-3 py-2.5 font-medium text-white">{s.player.name}</td>
              <td className="px-2 py-2.5 text-center text-green-400 font-bold">{s.w}</td>
              <td className="px-2 py-2.5 text-center text-red-400 font-bold">{s.l}</td>
              <td className="px-2 py-2.5 text-center text-gray-400 text-xs">{s.pf}-{s.pa}</td>
              <td className="px-3 py-2.5 text-center font-black text-sm text-gray-300">{s.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ScheduleView({ tournaments, matches }) {
  const [selectedTournament, setSelectedTournament] = useState('all')

  const scheduled = matches
    .filter(m => {
      if (!m.scheduledTime) return false
      if (selectedTournament === 'all') return true
      return m.tournamentId === selectedTournament
    })
    .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))

  const byDate = {}
  scheduled.forEach(m => {
    const d = new Date(m.scheduledTime).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(m)
  })

  const getTournamentName = id => tournaments.find(t => t.id === id)?.name || ''

  const now = new Date()
  const nextMatch = scheduled.find(m => m.status !== 'done' && new Date(m.scheduledTime) >= now)

  return (
    <div className="space-y-4">
      {/* Tournament filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setSelectedTournament('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selectedTournament === 'all' ? 'bg-green-600 text-white border-green-600' : 'border-gray-600 text-gray-400 hover:border-green-500'}`}>
          Tất cả
        </button>
        {tournaments.map(t => (
          <button key={t.id} onClick={() => setSelectedTournament(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selectedTournament === t.id ? 'bg-green-600 text-white border-green-600' : 'border-gray-600 text-gray-400 hover:border-green-500'}`}>
            {t.name}
          </button>
        ))}
      </div>

      {/* Next match highlight */}
      {nextMatch && (
        <div className="bg-green-900 border border-green-600 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-xs text-green-300 font-semibold uppercase tracking-wide">Trận tiếp theo</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center shrink-0">
              <div className="font-black text-green-300 text-lg">
                {new Date(nextMatch.scheduledTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {nextMatch.court && <div className="text-xs text-green-400">Sân {nextMatch.court}</div>}
            </div>
            <div className="flex-1 flex items-center justify-center gap-3">
              <span className="font-bold text-white text-right flex-1">{nextMatch.player1.name}</span>
              <span className="text-green-400 font-black text-sm px-2">VS</span>
              <span className="font-bold text-white flex-1">{nextMatch.player2.name}</span>
            </div>
          </div>
        </div>
      )}

      {Object.keys(byDate).length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Calendar size={40} className="mx-auto mb-2 opacity-20" />
          <p>Chưa có lịch thi đấu</p>
        </div>
      ) : (
        Object.entries(byDate).map(([date, dayMatches]) => (
          <div key={date} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
            <div className="bg-gray-700 px-4 py-3 flex items-center justify-between">
              <span className="font-bold text-white text-sm capitalize">{date}</span>
              <span className="text-xs text-gray-400">{dayMatches.length} trận</span>
            </div>
            <div className="divide-y divide-gray-700">
              {dayMatches.map(m => {
                const t = new Date(m.scheduledTime)
                const timeStr = t.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                const isDone = m.status === 'done'
                const isNext = m.id === nextMatch?.id
                return (
                  <div key={m.id} className={`flex items-center gap-3 px-4 py-3 ${isNext ? 'bg-green-900 bg-opacity-40' : ''}`}>
                    <div className="w-14 shrink-0 text-center">
                      <div className={`font-bold text-sm ${isNext ? 'text-green-300' : isDone ? 'text-gray-500' : 'text-white'}`}>{timeStr}</div>
                      {m.court && (
                        <div className="text-xs text-gray-500 flex items-center justify-center gap-0.5 mt-0.5">
                          <MapPin size={9} /> Sân {m.court}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className={`flex-1 text-right text-sm font-medium truncate ${m.winner === m.player1.id ? 'text-yellow-300 font-bold' : isDone ? 'text-gray-500' : 'text-white'}`}>
                        {m.player1.name}
                      </span>
                      <div className={`shrink-0 px-2.5 py-1 rounded-lg border text-sm font-bold min-w-[52px] text-center ${isDone ? 'bg-gray-700 border-gray-600' : 'bg-gray-700 border-gray-600'}`}>
                        {isDone ? `${m.score1} : ${m.score2}` : <span className="text-gray-500 text-xs font-normal">vs</span>}
                      </div>
                      <span className={`flex-1 text-sm font-medium truncate ${m.winner === m.player2.id ? 'text-yellow-300 font-bold' : isDone ? 'text-gray-500' : 'text-white'}`}>
                        {m.player2.name}
                      </span>
                    </div>
                    <div className="shrink-0 w-14 text-right">
                      {m.stage === 'knockout' ? (
                        <span className="text-xs text-orange-400 font-medium">KO</span>
                      ) : m.group ? (
                        <span className="text-xs text-gray-500">Bảng {m.group}</span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function ViewerMatchRow({ match, highlight }) {
  const isDone = match.status === 'done'
  const w1 = match.winner === match.player1.id
  const w2 = match.winner === match.player2.id

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDone ? 'bg-gray-700' : 'bg-gray-750 border border-gray-600'} ${highlight ? 'border border-yellow-600' : ''}`}>
      <span className={`flex-1 text-right text-xs font-medium truncate ${w1 ? 'text-yellow-300 font-bold' : isDone ? 'text-gray-400' : 'text-gray-200'}`}>
        {w1 && '🏆 '}{match.player1.name}
      </span>
      <div className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold min-w-[44px] text-center ${isDone ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-500'}`}>
        {isDone ? `${match.score1}:${match.score2}` : 'vs'}
      </div>
      <span className={`flex-1 text-xs font-medium truncate ${w2 ? 'text-yellow-300 font-bold' : isDone ? 'text-gray-400' : 'text-gray-200'}`}>
        {w2 && '🏆 '}{match.player2.name}
      </span>
    </div>
  )
}
