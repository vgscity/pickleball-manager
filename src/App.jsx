import { useState, useEffect } from 'react'
import { useStore } from './store'
import Dashboard from './components/Dashboard'
import Players from './components/Players'
import Tournaments from './components/Tournaments'
import Schedule from './components/Schedule'
import Finance from './components/Finance'
import Settings from './components/Settings'
import Login from './components/Login'
import Register from './components/Register'
import SuperAdmin from './components/SuperAdmin'
import ViewerApp from './components/ViewerApp'
import { LayoutDashboard, Users, Trophy, Calendar, DollarSign, Settings2, Menu, X, Eye, LogOut, Crown } from 'lucide-react'

const tabs = [
  { id: 'dashboard',   label: 'Tổng quan',    icon: <LayoutDashboard size={18} /> },
  { id: 'players',     label: 'Thành viên',   icon: <Users size={18} /> },
  { id: 'tournaments', label: 'Giải đấu',     icon: <Trophy size={18} /> },
  { id: 'schedule',    label: 'Lịch thi đấu', icon: <Calendar size={18} /> },
  { id: 'finance',     label: 'Thu chi',      icon: <DollarSign size={18} /> },
  { id: 'settings',    label: 'Cài đặt',      icon: <Settings2 size={18} /> },
]

// Get ?view=TOKEN from URL
function getViewToken() {
  const params = new URLSearchParams(window.location.search)
  return params.get('view') || null
}

export default function App() {
  const viewToken = getViewToken()
  const { data, update, loading } = useStore(viewToken)
  const settings = data.settings || {}

  const [activeTab, setActiveTab] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)

  // Auth state
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem('pb_token'))
  const [plan, setPlan] = useState(() => sessionStorage.getItem('pb_plan') || 'free')
  const [isSuperAdmin, setIsSuperAdmin] = useState(() => sessionStorage.getItem('pb_is_super_admin') === 'true')

  // Apply web title dynamically
  useEffect(() => {
    document.title = settings.webTitle || settings.clubName || 'Pickleball CLB'
  }, [settings.webTitle, settings.clubName])

  // Update favicon dynamically
  useEffect(() => {
    const setFavicon = (href) => {
      let link = document.querySelector("link[rel~='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = href
    }

    if (settings.logoUrl) {
      setFavicon(settings.logoUrl)
    } else {
      const emoji = settings.logoEmoji || '🏓'
      const canvas = document.createElement('canvas')
      canvas.width = 64; canvas.height = 64
      const ctx = canvas.getContext('2d')
      ctx.font = '52px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(emoji, 32, 36)
      setFavicon(canvas.toDataURL())
    }
  }, [settings.logoUrl, settings.logoEmoji])

  const handleLogin = (body) => {
    setAuthed(true)
    setPlan(body.plan || 'free')
    const sa = !!body.isSuperAdmin
    setIsSuperAdmin(sa)
    sessionStorage.setItem('pb_is_super_admin', sa ? 'true' : 'false')
    // Reload store data for this user
    window.location.reload()
  }

  const handleRegister = (body) => {
    setAuthed(true)
    setPlan(body.plan || 'free')
    setIsSuperAdmin(false)
    sessionStorage.setItem('pb_is_super_admin', 'false')
    window.location.reload()
  }

  const handleLogout = () => {
    sessionStorage.removeItem('pb_token')
    sessionStorage.removeItem('pb_plan')
    sessionStorage.removeItem('pb_email')
    sessionStorage.removeItem('pb_is_super_admin')
    setAuthed(false)
    setIsSuperAdmin(false)
    setMenuOpen(false)
    // Go back to viewer mode (remove ?view param if any)
    window.location.href = window.location.pathname
  }

  const isPro = plan === 'pro'

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

  // Public viewer mode (?view=TOKEN)
  if (viewToken) {
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-4xl mb-3">🏓</div>
            <p className="text-gray-400">Đang tải...</p>
          </div>
        </div>
      )
    }
    return <ViewerApp data={data} />
  }

  // Not logged in → show viewer with Admin entry button
  if (!authed) {
    return (
      <div className="relative">
        <ViewerApp data={data} />
        <div className="fixed bottom-5 right-5 z-50">
          <AdminEntryButton settings={settings} />
        </div>
      </div>
    )
  }

  // Super admin dashboard
  if (isSuperAdmin) {
    return <SuperAdmin onLogout={handleLogout} />
  }

  // Admin app
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 shadow-sm fixed top-0 bottom-0 left-0">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Logo />
            <div className="min-w-0">
              <div className="font-bold text-gray-800 text-sm leading-tight truncate">{clubName}</div>
              <div className="flex items-center gap-1 mt-0.5">
                {isPro
                  ? <span className="text-xs text-yellow-600 font-semibold flex items-center gap-1"><Crown size={11} /> Pro</span>
                  : <span className="text-xs text-gray-400">Gói Free</span>
                }
              </div>
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
            <div className="min-w-0">
              <span className="font-bold text-gray-800 text-sm truncate max-w-[120px] block">{clubName}</span>
              {isPro && <span className="text-xs text-yellow-600 font-semibold flex items-center gap-0.5"><Crown size={10} /> Pro</span>}
            </div>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg hover:bg-gray-100">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
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
          {activeTab === 'dashboard'   && <Dashboard data={data} onTabChange={setActiveTab} />}
          {activeTab === 'players'     && (
            <Players
              players={data.players}
              onChange={p => update('players', p)}
              plan={plan}
            />
          )}
          {activeTab === 'tournaments' && (
            <Tournaments
              tournaments={data.tournaments} players={data.players} matches={data.matches}
              onTournamentsChange={t => update('tournaments', t)}
              onMatchesChange={m => update('matches', m)}
              plan={plan}
            />
          )}
          {activeTab === 'schedule'    && (
            <Schedule matches={data.matches} tournaments={data.tournaments} onMatchesChange={m => update('matches', m)} />
          )}
          {activeTab === 'finance'     && (
            <Finance transactions={data.transactions} tournaments={data.tournaments} onTransactionsChange={t => update('transactions', t)} />
          )}
          {activeTab === 'settings'    && (
            <Settings settings={data.settings} onChange={s => update('settings', s)} plan={plan} />
          )}
        </div>
      </main>
    </div>
  )
}

// Separate component for the admin entry button shown in viewer mode
function AdminEntryButton({ settings }) {
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  const handleLogin = (body) => {
    sessionStorage.setItem('pb_token', body.token)
    sessionStorage.setItem('pb_plan', body.plan)
    sessionStorage.setItem('pb_email', body.email)
    sessionStorage.setItem('pb_is_super_admin', body.isSuperAdmin ? 'true' : 'false')
    window.location.reload()
  }

  const handleRegister = (body) => {
    sessionStorage.setItem('pb_token', body.token)
    sessionStorage.setItem('pb_plan', body.plan)
    sessionStorage.setItem('pb_email', body.email)
    sessionStorage.setItem('pb_is_super_admin', 'false')
    window.location.reload()
  }

  if (showRegister) {
    return <Register onRegister={handleRegister} onBackToLogin={() => setShowRegister(false)} />
  }

  if (showLogin) {
    return <Login settings={settings} onLogin={handleLogin} onGoRegister={() => { setShowLogin(false); setShowRegister(true) }} />
  }

  return (
    <button
      onClick={() => setShowLogin(true)}
      className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-full shadow-xl border border-gray-600 text-sm font-medium transition-all"
    >
      <Settings2 size={15} /> Admin
    </button>
  )
}
