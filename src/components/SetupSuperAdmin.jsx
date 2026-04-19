import { useState } from 'react'
import { Shield, Lock, Mail, Eye, EyeOff, Check } from 'lucide-react'

export default function SetupSuperAdmin({ onDone }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Mật khẩu xác nhận không khớp'); return }
    if (password.length < 6) { setError('Mật khẩu tối thiểu 6 ký tự'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const body = await res.json()
      if (!res.ok) { setError(body.error || 'Lỗi thiết lập'); return }
      setSuccess(true)
      setTimeout(() => onDone(), 2000)
    } catch {
      setError('Không kết nối được server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-7">
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-gray-900">Thiết lập Super Admin</h1>
          <p className="text-sm text-gray-400 mt-1 text-center">
            Chỉ thực hiện một lần duy nhất.<br />
            Sau khi tạo, trang này sẽ bị khoá vĩnh viễn.
          </p>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check size={28} className="text-green-600" />
            </div>
            <p className="font-semibold text-gray-800">Thiết lập thành công!</p>
            <p className="text-sm text-gray-500 mt-1">Đang chuyển hướng...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Super Admin</label>
              <div className="relative mt-1">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" required autoFocus
                  className="w-full pl-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="admin@example.com"
                  value={email} onChange={e => { setEmail(e.target.value); setError('') }} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mật khẩu</label>
              <div className="relative mt-1">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={show ? 'text' : 'password'} required
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Tối thiểu 6 ký tự"
                  value={password} onChange={e => { setPassword(e.target.value); setError('') }} />
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
                  className="w-full pl-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Nhập lại mật khẩu"
                  value={confirm} onChange={e => { setConfirm(e.target.value); setError('') }} />
              </div>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-md">
              <Shield size={16} /> {loading ? 'Đang thiết lập...' : 'Tạo Super Admin'}
            </button>
          </form>
        )}

        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            🔒 Trang này chỉ xuất hiện khi chưa có super admin nào trong hệ thống.
          </p>
        </div>
      </div>
    </div>
  )
}
