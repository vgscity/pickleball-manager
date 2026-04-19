import { useState } from 'react'
import { Eye, EyeOff, LogIn, Lock, Mail } from 'lucide-react'

export default function Login({ settings, onLogin, onGoRegister }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const clubName = settings?.clubName || 'Pickleball Manager'
  const logoEmoji = settings?.logoEmoji || '🏓'
  const logoUrl = settings?.logoUrl || ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw }),
      })
      const body = await res.json()
      if (!res.ok) { setError(body.error || 'Đăng nhập thất bại') }
      else {
        sessionStorage.setItem('pb_token', body.token)
        sessionStorage.setItem('pb_plan', body.plan)
        sessionStorage.setItem('pb_email', body.email)
        onLogin(body)
      }
    } catch {
      setError('Không kết nối được server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-gray-900 to-gray-900 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 my-4">
        <div className="flex flex-col items-center mb-7">
          {logoUrl
            ? <img src={logoUrl} alt="logo" className="w-16 h-16 rounded-xl object-cover mb-3 shadow" />
            : <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-3xl mb-3 shadow-lg">{logoEmoji}</div>
          }
          <h1 className="text-xl font-black text-gray-900">{clubName}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Đăng nhập quản trị</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
            <div className="relative mt-1">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" required autoFocus
                className={`w-full pl-9 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${error ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-green-400'}`}
                placeholder="email@example.com"
                value={email} onChange={e => { setEmail(e.target.value); setError('') }} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mật khẩu</label>
            <div className="relative mt-1">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={show ? 'text' : 'password'} required
                className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${error ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-green-400'}`}
                placeholder="Mật khẩu..."
                value={pw} onChange={e => { setPw(e.target.value); setError('') }} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-md">
            <LogIn size={16} /> {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">Chưa có tài khoản?{' '}
            <button onClick={onGoRegister} className="text-green-600 font-semibold hover:underline">Đăng ký miễn phí</button>
          </p>
        </div>
      </div>
    </div>
  )
}
