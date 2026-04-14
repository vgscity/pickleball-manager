import { useState, useEffect } from 'react'
import { useStore } from './store'
import Dashboard from './components/Dashboard'
import Players from './components/Players'
import Tournaments from './components/Tournaments'
import Schedule from './components/Schedule'
import Finance from './components/Finance'
import Settings from './components/Settings'
import Login from './components/Login'
import ViewerApp from './components/ViewerApp'
import { LayoutDashboard, Users, Trophy, Calendar, DollarSign, Settings2, Menu, X, Eye, LogOut } from 'lucide-react'

const tabs = [
  { id: 'dashboard', label: 'Tổng quan',   icon: <LayoutDashboard size={18} /> },
  { id: 'players',   label: 'Thành viên',  icon: <Users size={18} /> },
  { id: 'tournaments', label: 'Giải đấu', icon: <Trophy size={18} /> },
  { id: 'schedule',  label: 'Lịch thi đấu', icon: <Calendar size={18} /> },
  { id: 'finance',   label: 'Thu chi',     icon: <DollarSign size={18} /> },
  { id: 'settings',  label: 'Cài đặt',     icon: <Settings2 size={18} /> },
]

export default function App() {
  const { data, update } = useStore()
  const settings = data.settings || {}

  const [activeTab, setActiveTab] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [mode, setMode] = useState(() => localStorage.getItem('pb_view_mode') || 'viewer')
  // Auth: session-only (clears on tab close)
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem('pb_token'))

  // Apply web title dynamically
  useEffect(() => {
    document.title = settings.webTitle || settings.clubName || 'Pickleball CLB'
  }, [settings.webTitle, settings.clubName])

  const handleLogin = () => {
    setAuthed(true)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('pb_token')
    setAuthed(false)
    setMenuOpen(false)
    toggleMode('viewer')
  }

  const toggleMode = (m) => {
    setMode(m)
    localStorage.setItem('pb_view_mode', m)
    setMenuOpen(false)
  }

  const clubName = settings.clubName || 'Pickleball CLB'
  const logoEmoji = settings.logoEmoji || '🏓'
  const logoUrl = settings.logoUrl || ''

  const Logo = ({ size = 'md' }) => {
    const cls = size === 'sm'
      ? 'w-8 h-8 text-lg rounded-lg'
      : 'w-9 h-9 text-xl rounded-xl'
    return logoUrl
      ? <img src={logoUrl} alt="logo" className={`${cls} object-cover border border-white border-opacity-20`} />
      : <div className={`${cls} bg-green-600 flex items-center justify-center font-black shrink-0`}>{logoEmoji}</div>
  }

  // Viewer mode — no auth required
  if (mode === 'viewer') {
    return (
      <div className="relative">
        <ViewerApp data={data} />
        <button onClick={() => toggleMode('admin')}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-full shadow-xl border border-gray-600 text-sm font-medium transition-all">
          <Settings2 size={15} /> Admin
        </button>
      </div>
    )
  }

  // Admin mode — require login
  if (!authed) {
    return <Login settings={settings} onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 shadow-sm fixed top-0 bottom-0 left-0">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Logo />
            <div className="min-w-0">
              <div className="font-bold text-gray-800 text-sm leading-tight truncate">{clubName}</div>
              <div className="text-xs text-gray-400">Quản trị viên</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === t.id ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100 space-y-1">
          <button onClick={() => toggleMode('viewer')}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 border border-dashed border-gray-200 transition-all">
            <Eye size={16} className="text-green-600" /> Chế độ xem
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all">
            <LogOut size={16} /> Đăng xuất
          </button>
          <div className="text-xs text-gray-400 text-center pt-1">Dữ liệu lưu tự động 💾</div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-bold text-gray-800 text-sm truncate max-w-[140px]">{clubName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toggleMode('viewer')}
              className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-lg font-medium">
              <Eye size={13} /> Xem
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg hover:bg-gray-100">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="bg-white border-t border-gray-100 p-2 space-y-1 shadow-lg">
            {tabs.map(t => (
              <button key={t.id} onClick={() => { setActiveTab(t.id); setMenuOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === t.id ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                {t.icon} {t.label}
              </button>
            ))}
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 transition-all">
              <LogOut size={18} /> Đăng xuất
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 lg:ml-60">
        <div className="lg:hidden h-16" />
        <div className="max-w-5xl mx-auto p-4 sm:p-6">
          {activeTab === 'dashboard'    && <Dashboard data={data} onTabChange={setActiveTab} />}
          {activeTab === 'players'      && <Players players={data.players} onChange={p => update('players', p)} />}
          {activeTab === 'tournaments'  && (
            <Tournaments
              tournaments={data.tournaments} players={data.players} matches={data.matches}
              onTournamentsChange={t => update('tournaments', t)}
              onMatchesChange={m => update('matches', m)}
            />
          )}
          {activeTab === 'schedule'     && (
            <Schedule matches={data.matches} tournaments={data.tournaments} onMatchesChange={m => update('matches', m)} />
          )}
          {activeTab === 'finance'      && (
            <Finance transactions={data.transactions} tournaments={data.tournaments} onTransactionsChange={t => update('transactions', t)} />
          )}
          {activeTab === 'settings'     && (
            <Settings settings={data.settings} onChange={s => update('settings', s)} />
          )}
        </div>
      </main>
    </div>
  )
}
