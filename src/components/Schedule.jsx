import { useState } from 'react'
import { Calendar, Clock, Plus, Check, X, ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import { genId, formatDateTime } from '../utils'

export default function Schedule({ matches, tournaments, onMatchesChange }) {
  const [selectedTournament, setSelectedTournament] = useState('all')
  const [showScheduler, setShowScheduler] = useState(false)
  const [schedForm, setSchedForm] = useState({
    tournamentId: '',
    startDate: '',
    startTime: '07:00',
    matchDuration: 30,
    breakBetween: 10,
    courtsCount: 2,
  })

  const activeTournaments = tournaments.filter(t => t.status !== 'setup')

  const handleAutoSchedule = () => {
    if (!schedForm.tournamentId || !schedForm.startDate) {
      alert('Vui lòng chọn giải đấu và ngày bắt đầu')
      return
    }
    const toSchedule = matches.filter(m => m.tournamentId === schedForm.tournamentId && !m.scheduledTime)
    if (!toSchedule.length) {
      alert('Không có trận nào cần xếp lịch (tất cả đã có lịch hoặc chưa tạo bảng đấu)')
      return
    }

    const [h, min] = schedForm.startTime.split(':').map(Number)
    let currentTime = new Date(`${schedForm.startDate}T${schedForm.startTime}:00`)
    const courts = schedForm.courtsCount
    const slotMs = (schedForm.matchDuration + schedForm.breakBetween) * 60 * 1000
    const courtQueues = Array.from({ length: courts }, (_, i) => ({
      court: i + 1,
      available: new Date(currentTime),
    }))

    const updated = matches.map(m => {
      if (m.tournamentId !== schedForm.tournamentId || m.scheduledTime) return m
      // Assign to earliest available court
      courtQueues.sort((a, b) => a.available - b.available)
      const slot = courtQueues[0]
      const scheduled = new Date(slot.available)
      slot.available = new Date(slot.available.getTime() + slotMs)
      return { ...m, scheduledTime: scheduled.toISOString(), court: slot.court }
    })

    onMatchesChange(updated)
    setShowScheduler(false)
    setSchedForm({ tournamentId: '', startDate: '', startTime: '07:00', matchDuration: 30, breakBetween: 10, courtsCount: 2 })
  }

  const handleClearSchedule = (tournamentId) => {
    if (!confirm('Xóa toàn bộ lịch của giải đấu này?')) return
    onMatchesChange(matches.map(m =>
      m.tournamentId === tournamentId ? { ...m, scheduledTime: null, court: null } : m
    ))
  }

  const visibleMatches = matches
    .filter(m => {
      if (selectedTournament === 'all') return !!m.scheduledTime
      return m.tournamentId === selectedTournament && !!m.scheduledTime
    })
    .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))

  const unscheduled = matches.filter(m =>
    selectedTournament === 'all'
      ? !m.scheduledTime
      : m.tournamentId === selectedTournament && !m.scheduledTime
  )

  // Group by date
  const byDate = {}
  visibleMatches.forEach(m => {
    const d = new Date(m.scheduledTime).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(m)
  })

  const getTournamentName = (id) => tournaments.find(t => t.id === id)?.name || 'Không rõ'
  const statusColor = { pending: 'bg-blue-50 border-blue-200', done: 'bg-green-50 border-green-200' }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Lịch thi đấu</h2>
        </div>
        <button
          onClick={() => setShowScheduler(!showScheduler)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Clock size={16} />
          Xếp lịch tự động
        </button>
      </div>

      {showScheduler && (
        <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-3">Xếp lịch thi đấu</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs text-gray-500 font-medium">Giải đấu *</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={schedForm.tournamentId}
                onChange={e => setSchedForm({ ...schedForm, tournamentId: e.target.value })}
              >
                <option value="">-- Chọn giải đấu --</option>
                {activeTournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Ngày bắt đầu *</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={schedForm.startDate} onChange={e => setSchedForm({ ...schedForm, startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Giờ bắt đầu</label>
              <input type="time" className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={schedForm.startTime} onChange={e => setSchedForm({ ...schedForm, startTime: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Số sân</label>
              <input type="number" min="1" max="10" className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={schedForm.courtsCount} onChange={e => setSchedForm({ ...schedForm, courtsCount: parseInt(e.target.value) || 1 })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Thời gian mỗi trận (phút)</label>
              <input type="number" min="10" max="120" step="5" className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={schedForm.matchDuration} onChange={e => setSchedForm({ ...schedForm, matchDuration: parseInt(e.target.value) || 30 })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Nghỉ giữa các trận (phút)</label>
              <input type="number" min="0" max="60" step="5" className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={schedForm.breakBetween} onChange={e => setSchedForm({ ...schedForm, breakBetween: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAutoSchedule} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Check size={14} /> Tạo lịch
            </button>
            <button onClick={() => setShowScheduler(false)} className="flex items-center gap-1 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm text-gray-600">
              <X size={14} /> Hủy
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedTournament('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${selectedTournament === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}
        >
          Tất cả
        </button>
        {tournaments.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedTournament(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${selectedTournament === t.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {unscheduled.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
          <strong>{unscheduled.length} trận</strong> chưa có lịch thi đấu.
          {selectedTournament !== 'all' && (
            <button onClick={() => handleClearSchedule(selectedTournament)} className="ml-3 text-xs text-red-500 underline">Xóa lịch giải này</button>
          )}
        </div>
      )}

      {Object.keys(byDate).length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Calendar size={40} className="mx-auto mb-2 opacity-30" />
          <p>Chưa có lịch thi đấu</p>
          <p className="text-xs mt-1">Tạo bảng đấu rồi nhấn "Xếp lịch tự động"</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byDate).map(([date, dayMatches]) => (
            <div key={date} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-100">
                <div className="font-semibold text-blue-800 text-sm capitalize">{date}</div>
                <div className="text-xs text-blue-600">{dayMatches.length} trận</div>
              </div>
              <div className="p-3 space-y-2">
                {dayMatches.map(m => {
                  const t = new Date(m.scheduledTime)
                  const timeStr = t.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={m.id} className={`flex items-center gap-3 p-3 rounded-lg border ${statusColor[m.status] || 'bg-gray-50 border-gray-200'}`}>
                      <div className="text-center shrink-0 w-12">
                        <div className="font-bold text-sm text-gray-800">{timeStr}</div>
                        {m.court && (
                          <div className="text-xs text-gray-500 flex items-center gap-0.5 justify-center mt-0.5">
                            <MapPin size={10} /> Sân {m.court}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className={`flex-1 text-right text-sm font-medium truncate ${m.winner === m.player1.id ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>
                          {m.player1.name}
                        </span>
                        <div className="shrink-0 flex items-center gap-1 bg-white rounded-lg px-2 py-0.5 border border-gray-200">
                          <span className="font-bold text-sm">{m.score1 || '-'}</span>
                          <span className="text-gray-400 text-xs">:</span>
                          <span className="font-bold text-sm">{m.score2 || '-'}</span>
                        </div>
                        <span className={`flex-1 text-left text-sm font-medium truncate ${m.winner === m.player2.id ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>
                          {m.player2.name}
                        </span>
                      </div>
                      <div className="shrink-0">
                        {m.status === 'done' ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Xong</span>
                        ) : (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Chờ</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
