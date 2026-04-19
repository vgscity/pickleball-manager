import { useState, useEffect } from 'react'
import { Shield, Crown, UserX, RefreshCw, Users, ChevronDown } from 'lucide-react'

export default function SuperAdmin({ onLogout }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  const token = sessionStorage.getItem('pb_token')

  const loadUsers = async () => {
    setLoading(true)
    const res = await fetch('/api/superadmin/users', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  const handleChangePlan = async (userId, plan) => {
    setUpdating(userId)
    const res = await fetch(`/api/superadmin/users/${userId}/plan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan }),
    })
    const body = await res.json()
    if (body.ok) {
      setUsers(u => u.map(x => x.id === userId
        ? { ...x, plan, public_token: body.publicToken || x.public_token }
        : x))
    }
    setUpdating(null)
  }

  const handleDelete = async (userId, email) => {
    if (!confirm(`Xóa tài khoản ${email}? Toàn bộ dữ liệu sẽ mất.`)) return
    await fetch(`/api/superadmin/users/${userId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setUsers(u => u.filter(x => x.id !== userId))
  }

  const copyViewerLink = (token) => {
    const url = `${window.location.origin}/?view=${token}`
    navigator.clipboard.writeText(url)
    alert('Đã copy viewer link!')
  }

  const freeCount = users.filter(u => u.plan === 'free').length
  const proCount = users.filter(u => u.plan === 'pro').length

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black">Super Admin</h1>
              <p className="text-xs text-gray-400">Quản lý tất cả tài khoản CLB</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadUsers} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
              <RefreshCw size={16} />
            </button>
            <button onClick={onLogout} className="text-xs text-gray-400 hover:text-red-400 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-red-500 transition-colors">
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Tổng CLB', value: users.length, color: 'bg-blue-900 border-blue-700' },
            { label: 'Free', value: freeCount, color: 'bg-gray-800 border-gray-600' },
            { label: 'Pro', value: proCount, color: 'bg-yellow-900 border-yellow-600' },
          ].map(s => (
            <div key={s.label} className={`${s.color} border rounded-xl p-3 text-center`}>
              <div className="text-2xl font-black">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_100px_100px] gap-3 px-4 py-2.5 bg-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <div>CLB / Email</div>
            <div>Ngày đăng ký</div>
            <div className="text-center">Plan</div>
            <div className="text-center">Hành động</div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Đang tải...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              <p>Chưa có tài khoản nào</p>
            </div>
          ) : users.map((u, i) => (
            <div key={u.id} className={`grid grid-cols-[1fr_120px_100px_100px] gap-3 px-4 py-3 items-center ${i !== 0 ? 'border-t border-gray-800' : ''} hover:bg-gray-800/50 transition-colors`}>
              <div className="min-w-0">
                <div className="font-medium text-sm text-white truncate">{u.club_name || '(Chưa đặt tên)'}</div>
                <div className="text-xs text-gray-400 truncate">{u.email}</div>
                {u.public_token && (
                  <button onClick={() => copyViewerLink(u.public_token)} className="text-xs text-blue-400 hover:underline mt-0.5">
                    📋 Copy viewer link
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '—'}
              </div>
              <div className="text-center">
                <select
                  value={u.plan}
                  disabled={updating === u.id}
                  onChange={e => handleChangePlan(u.id, e.target.value)}
                  className={`text-xs px-2 py-1 rounded-lg border cursor-pointer transition-colors ${u.plan === 'pro' ? 'bg-yellow-900 border-yellow-600 text-yellow-300' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>
                  <option value="free">Free</option>
                  <option value="pro">Pro ⭐</option>
                </select>
              </div>
              <div className="text-center">
                <button onClick={() => handleDelete(u.id, u.email)} className="p-1.5 hover:bg-red-900 rounded-lg text-gray-500 hover:text-red-400 transition-colors">
                  <UserX size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
