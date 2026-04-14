import { useState } from 'react'
import { DollarSign, Plus, Trash2, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Check, X, Filter } from 'lucide-react'
import { genId, formatCurrency, formatDate } from '../utils'

const CATEGORIES_IN = ['Phí đăng ký', 'Tài trợ', 'Bán vé', 'Quyên góp', 'Khác']
const CATEGORIES_OUT = ['Giải thưởng', 'Thuê sân', 'Thiết bị/Dụng cụ', 'In ấn/Truyền thông', 'Ăn uống', 'Vận chuyển', 'Khác']

export default function Finance({ transactions, tournaments, onTransactionsChange }) {
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterTournament, setFilterTournament] = useState('all')
  const [form, setForm] = useState({
    type: 'income',
    amount: '',
    category: 'Phí đăng ký',
    description: '',
    date: new Date().toISOString().split('T')[0],
    tournamentId: '',
  })

  const handleTypeChange = (type) => {
    setForm(f => ({ ...f, type, category: type === 'income' ? CATEGORIES_IN[0] : CATEGORIES_OUT[0] }))
  }

  const handleSave = () => {
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) { alert('Vui lòng nhập số tiền hợp lệ'); return }
    if (!form.description.trim()) { alert('Vui lòng nhập mô tả'); return }
    onTransactionsChange([
      ...transactions,
      { id: genId(), ...form, amount, createdAt: new Date().toISOString() }
    ])
    setForm({ type: 'income', amount: '', category: 'Phí đăng ký', description: '', date: new Date().toISOString().split('T')[0], tournamentId: '' })
    setShowForm(false)
  }

  const handleDelete = (id) => {
    if (confirm('Xóa giao dịch này?')) onTransactionsChange(transactions.filter(t => t.id !== id))
  }

  const filtered = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false
    if (filterTournament !== 'all' && t.tournamentId !== filterTournament) return false
    return true
  }).sort((a, b) => new Date(b.date) - new Date(a.date))

  const totalIn = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIn - totalOut

  const categories = form.type === 'income' ? CATEGORIES_IN : CATEGORIES_OUT

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign size={20} className="text-purple-600" />
          <h2 className="text-xl font-bold text-gray-800">Quản lý Thu Chi</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Thêm giao dịch
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpCircle size={18} className="text-green-600" />
            <span className="text-sm font-medium text-green-700">Tổng thu</span>
          </div>
          <div className="text-xl font-bold text-green-700">{formatCurrency(totalIn)}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownCircle size={18} className="text-red-500" />
            <span className="text-sm font-medium text-red-600">Tổng chi</span>
          </div>
          <div className="text-xl font-bold text-red-600">{formatCurrency(totalOut)}</div>
        </div>
        <div className={`border rounded-xl p-4 ${balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            {balance >= 0
              ? <TrendingUp size={18} className="text-blue-600" />
              : <TrendingDown size={18} className="text-orange-600" />}
            <span className={`text-sm font-medium ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Số dư</span>
          </div>
          <div className={`text-xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(balance)}</div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-purple-200 rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-3">Thêm giao dịch mới</h3>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.type === 'income' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              <ArrowUpCircle size={14} className="inline mr-1" /> Thu
            </button>
            <button
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.type === 'expense' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              <ArrowDownCircle size={14} className="inline mr-1" /> Chi
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Số tiền (VND) *</label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="500000"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Ngày</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Danh mục</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Giải đấu liên quan</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={form.tournamentId} onChange={e => setForm({ ...form, tournamentId: e.target.value })}>
                <option value="">-- Không liên kết --</option>
                {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Mô tả *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Phí đăng ký 10 người..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleSave} className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Check size={14} /> Lưu
            </button>
            <button onClick={() => setShowForm(false)} className="flex items-center gap-1 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm text-gray-600">
              <X size={14} /> Hủy
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <Filter size={14} className="text-gray-400" />
        <div className="flex gap-1">
          {['all', 'income', 'expense'].map(f => (
            <button key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filterType === f ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              {f === 'all' ? 'Tất cả' : f === 'income' ? 'Thu' : 'Chi'}
            </button>
          ))}
        </div>
        <select
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
          value={filterTournament}
          onChange={e => setFilterTournament(e.target.value)}
        >
          <option value="all">Mọi giải đấu</option>
          <option value="">Không liên kết</option>
          {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <DollarSign size={40} className="mx-auto mb-2 opacity-30" />
          <p>Chưa có giao dịch nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[36px_80px_1fr_120px_120px_36px] gap-x-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div></div>
            <div>Ngày</div>
            <div>Mô tả / Danh mục</div>
            <div>Giải đấu</div>
            <div className="text-right">Số tiền</div>
            <div></div>
          </div>
          {/* Rows */}
          {filtered.map((tx, i) => {
            const isIn = tx.type === 'income'
            const tName = tx.tournamentId ? tournaments.find(t => t.id === tx.tournamentId)?.name : null
            return (
              <div key={tx.id}
                className={`grid grid-cols-[36px_80px_1fr_120px_120px_36px] gap-x-3 px-4 py-3 items-center group hover:bg-purple-50 transition-colors ${i !== 0 ? 'border-t border-gray-50' : ''}`}>
                {/* Icon */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isIn ? 'bg-green-100' : 'bg-red-100'}`}>
                  {isIn
                    ? <ArrowUpCircle size={14} className="text-green-600" />
                    : <ArrowDownCircle size={14} className="text-red-500" />}
                </div>
                {/* Ngày */}
                <div className="text-xs text-gray-500">{formatDate(tx.date)}</div>
                {/* Mô tả + danh mục */}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{tx.description}</div>
                  <span className="text-xs text-gray-400">{tx.category}</span>
                </div>
                {/* Giải đấu */}
                <div className="truncate">
                  {tName
                    ? <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{tName}</span>
                    : <span className="text-xs text-gray-300">—</span>}
                </div>
                {/* Số tiền */}
                <div className={`text-sm font-bold text-right ${isIn ? 'text-green-600' : 'text-red-500'}`}>
                  {isIn ? '+' : '-'}{formatCurrency(tx.amount)}
                </div>
                {/* Xóa */}
                <button onClick={() => handleDelete(tx.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-lg text-red-400 transition-all justify-self-center">
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Category breakdown */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h4 className="font-semibold text-sm text-gray-700 mb-3">Thống kê theo danh mục</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-semibold text-green-700 mb-1 uppercase tracking-wide">Thu</div>
              {CATEGORIES_IN.map(cat => {
                const total = transactions.filter(t => t.type === 'income' && t.category === cat).reduce((s, t) => s + t.amount, 0)
                if (!total) return null
                return (
                  <div key={cat} className="flex justify-between text-xs py-1 border-b border-gray-50">
                    <span className="text-gray-600">{cat}</span>
                    <span className="font-medium text-green-700">{formatCurrency(total)}</span>
                  </div>
                )
              })}
            </div>
            <div>
              <div className="text-xs font-semibold text-red-600 mb-1 uppercase tracking-wide">Chi</div>
              {CATEGORIES_OUT.map(cat => {
                const total = transactions.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0)
                if (!total) return null
                return (
                  <div key={cat} className="flex justify-between text-xs py-1 border-b border-gray-50">
                    <span className="text-gray-600">{cat}</span>
                    <span className="font-medium text-red-600">{formatCurrency(total)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
