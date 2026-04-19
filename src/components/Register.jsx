import { useState } from 'react'
import { Eye, EyeOff, UserPlus, Lock, Mail, Building2 } from 'lucide-react'

export default function Register({ onRegister, onBackToLogin }) {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', clubName: '' })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, clubName: form.clubName }),
      })
      const body = await res.json()
      if (!res.ok) { setError(body.error || 'Đăng ký thất bại'); return }
      sessionStorage.setItem('pb_token', body.token)
      sessionStorage.setItem('pb_plan', body.plan)
      sessionStorage.setItem('pb_email', body.email)
      onRegister(body)
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
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-3xl mb-3 shadow-lg">🏓</div>
          <h1 className="text-xl font-black text-gray-900">Tạo tài khoản CLB</h1>
          <p className="text-sm text-gray-400 mt-0.5">Miễn phí, không cần thẻ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tên CLB</label>
            <div className="relative mt-1">
              <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="w-full pl-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Pickleball CLB Hà Nội..."
                value={form.clubName} onChange={e => setForm({ ...form, clubName: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
            <div className="relative mt-1">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" required
                className="w-full pl-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="email@example.com"
                value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); setError('') }} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mật khẩu</label>
            <div className="relative mt-1">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={show ? 'text' : 'password'} required
                className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Tối thiểu 6 ký tự"
                value={form.password} onChange={e => { setForm({ ...form, password: e.target.value }); setError('') }} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Xác nhận mật khẩu</label>
            <div className="relative mt-1">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" required
                className="w-full pl-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Nhập lại mật khẩu"
                value={form.confirmPassword} onChange={e => { setForm({ ...form, confirmPassword: e.target.value }); setError('') }} />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-md">
            <UserPlus size={16} /> {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản miễn phí'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">Đã có tài khoản?{' '}
            <button onClick={onBackToLogin} className="text-green-600 font-semibold hover:underline">Đăng nhập</button>
          </p>
        </div>

        {/* Free plan info */}
        <div className="mt-4 bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-700">Gói Free bao gồm:</p>
          <p>✓ Tối đa 20 thành viên</p>
          <p>✓ 1 giải đấu active</p>
          <p>✓ Xem 3 giải đấu gần nhất</p>
          <p>✓ Quản lý thu chi</p>
          <p className="text-green-600 font-medium mt-1">Nâng cấp Pro → không giới hạn + viewer link</p>
        </div>
      </div>
    </div>
  )
}
