import { useState } from 'react'
import { UserPlus, Trash2, Edit2, Check, X, Search, Users } from 'lucide-react'
import { genId } from '../utils'

export default function Players({ players, onChange }) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', level: 'B', note: '' })
  const [search, setSearch] = useState('')

  const levels = ['A', 'B', 'C']

  const filtered = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || '').includes(search)
  )

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editId) {
      onChange(players.map(p => p.id === editId ? { ...p, ...form } : p))
      setEditId(null)
    } else {
      onChange([...players, { id: genId(), ...form, joinedAt: new Date().toISOString() }])
    }
    setForm({ name: '', phone: '', level: 'B', note: '' })
    setShowForm(false)
  }

  const handleEdit = (p) => {
    setForm({ name: p.name, phone: p.phone || '', level: p.level || 'Trung bình', note: p.note || '' })
    setEditId(p.id)
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (confirm('Xóa thành viên này?')) onChange(players.filter(p => p.id !== id))
  }

  const levelColor = {
    'A': 'bg-yellow-100 text-yellow-700',
    'B': 'bg-blue-100 text-blue-700',
    'C': 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-green-600" />
          <h2 className="text-xl font-bold text-gray-800">Thành viên CLB</h2>
          <span className="bg-green-100 text-green-700 text-sm px-2 py-0.5 rounded-full font-medium">
            {players.length} người
          </span>
          <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
            A: {players.filter(p => p.level === 'A').length}
          </span>
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
            B: {players.filter(p => p.level === 'B').length}
          </span>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', phone: '', level: 'B', note: '' }) }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus size={16} />
          Thêm thành viên
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-green-200 rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-3">{editId ? 'Sửa thông tin' : 'Thêm thành viên mới'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Họ tên *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Số điện thoại</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="0901234567"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Trình độ</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                value={form.level}
                onChange={e => setForm({ ...form, level: e.target.value })}
              >
                {levels.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Ghi chú</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="..."
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleSave} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Check size={14} /> Lưu
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="flex items-center gap-1 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm text-gray-600 transition-colors">
              <X size={14} /> Hủy
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="Tìm theo tên hoặc số điện thoại..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users size={40} className="mx-auto mb-2 opacity-30" />
          <p>Chưa có thành viên nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3 group hover:border-green-200 transition-colors">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 truncate">{p.name}</div>
                {p.phone && <div className="text-xs text-gray-500 mt-0.5">{p.phone}</div>}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColor[p.level] || 'bg-gray-100 text-gray-600'}`}>
                    {p.level || 'Trung bình'}
                  </span>
                </div>
                {p.note && <div className="text-xs text-gray-400 mt-1 truncate">{p.note}</div>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(p)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
