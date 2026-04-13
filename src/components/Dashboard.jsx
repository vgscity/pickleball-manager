import { Users, Trophy, Calendar, DollarSign, Activity, Clock } from 'lucide-react'
import { formatCurrency, formatDateTime } from '../utils'

export default function Dashboard({ data, onTabChange }) {
  const { players, tournaments, matches, transactions } = data

  const activeTournaments = tournaments.filter(t => t.status === 'active')
  const pendingMatches = matches.filter(m => m.status === 'pending' && m.scheduledTime)
  const nextMatches = [...pendingMatches]
    .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))
    .slice(0, 5)

  const totalIn = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIn - totalOut

  const stats = [
    { icon: <Users size={22} />, label: 'Thành viên', value: players.length, color: 'bg-green-100 text-green-700', tab: 'players' },
    { icon: <Trophy size={22} />, label: 'Giải đấu', value: tournaments.length, sub: `${activeTournaments.length} đang diễn ra`, color: 'bg-yellow-100 text-yellow-700', tab: 'tournaments' },
    { icon: <Activity size={22} />, label: 'Tổng trận', value: matches.length, sub: `${matches.filter(m => m.status === 'done').length} đã xong`, color: 'bg-blue-100 text-blue-700', tab: 'schedule' },
    { icon: <DollarSign size={22} />, label: 'Số dư', value: formatCurrency(balance), sub: balance >= 0 ? 'Dư quỹ' : 'Thiếu quỹ', color: balance >= 0 ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-600', tab: 'finance' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Tổng quan</h2>
        <p className="text-sm text-gray-500">Chào mừng đến hệ thống quản lý giải đấu Pickleball CLB</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <button
            key={s.label}
            onClick={() => onTabChange(s.tab)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md hover:border-gray-200 transition-all group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              {s.icon}
            </div>
            <div className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{s.value}</div>
            <div className="text-sm text-gray-600 font-medium">{s.label}</div>
            {s.sub && <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active tournaments */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Trophy size={16} className="text-yellow-500" /> Giải đang diễn ra
            </h3>
            <button onClick={() => onTabChange('tournaments')} className="text-xs text-blue-600 hover:underline">Xem tất cả</button>
          </div>
          {activeTournaments.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">Chưa có giải đấu nào đang diễn ra</div>
          ) : (
            <div className="space-y-2">
              {activeTournaments.map(t => {
                const tMatches = matches.filter(m => m.tournamentId === t.id)
                const done = tMatches.filter(m => m.status === 'done').length
                const pct = tMatches.length ? Math.round(done / tMatches.length * 100) : 0
                return (
                  <div key={t.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                    <div className="font-medium text-sm text-gray-800">{t.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{t.type === 'singles' ? 'Đơn' : 'Đôi'} · {t.participants.length} người</div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Tiến độ</span>
                        <span>{done}/{tMatches.length} trận ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-yellow-200 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Upcoming matches */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Clock size={16} className="text-blue-500" /> Trận sắp diễn ra
            </h3>
            <button onClick={() => onTabChange('schedule')} className="text-xs text-blue-600 hover:underline">Xem lịch</button>
          </div>
          {nextMatches.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">Không có trận nào sắp diễn ra</div>
          ) : (
            <div className="space-y-2">
              {nextMatches.map(m => (
                <div key={m.id} className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="text-center shrink-0">
                    <div className="text-xs font-bold text-blue-800">
                      {new Date(m.scheduledTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {m.court && <div className="text-xs text-blue-600">Sân {m.court}</div>}
                  </div>
                  <div className="flex-1 text-xs text-gray-700 min-w-0">
                    <span className="font-medium truncate">{m.player1.name}</span>
                    <span className="text-gray-400 mx-1">vs</span>
                    <span className="font-medium truncate">{m.player2.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <DollarSign size={16} className="text-purple-500" /> Giao dịch gần đây
            </h3>
            <button onClick={() => onTabChange('finance')} className="text-xs text-blue-600 hover:underline">Xem tất cả</button>
          </div>
          <div className="space-y-1.5">
            {[...transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map(tx => (
              <div key={tx.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-700 truncate flex-1">{tx.description}</span>
                <span className={`font-semibold ml-3 shrink-0 ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
