import { useState, useEffect, useRef } from 'react'
import { Settings2, Eye, EyeOff, Check, RefreshCw, ImagePlus, X } from 'lucide-react'

const EMOJIS = ['🏓', '🎾', '🏆', '⚡', '🔥', '🌟', '🎯', '💪', '🏅', '🥇']

export default function Settings({ settings, onChange }) {
  const [form, setForm] = useState({ ...settings })
  const [showPw, setShowPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => { setForm({ ...settings }) }, [settings])

  // Live update document title
  useEffect(() => {
    document.title = form.webTitle || form.clubName || 'Pickleball CLB'
  }, [form.webTitle, form.clubName])

  const handleSave = () => {
    onChange({ ...form })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Vui lòng chọn file ảnh'); return }
    if (file.size > 2 * 1024 * 1024) { alert('Ảnh tối đa 2MB'); return }
    setUploading(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setForm(f => ({ ...f, logoUrl: ev.target.result }))
      setUploading(false)
    }
    reader.readAsDataURL(file)
    e.target.value = '' // reset input
  }

  const handleChangePassword = async () => {
    setPwError('')
    setPwSuccess(false)
    if (!newPw || newPw.length < 4) { setPwError('Mật khẩu mới tối thiểu 4 ký tự'); return }
    if (newPw !== confirmPw) { setPwError('Mật khẩu xác nhận không khớp'); return }
    try {
      const token = sessionStorage.getItem('pb_token')
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const body = await res.json()
      if (!res.ok) { setPwError(body.error || 'Lỗi đổi mật khẩu'); return }
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setPwSuccess(true)
      setTimeout(() => setPwSuccess(false), 2500)
    } catch {
      setPwError('Không kết nối được server')
    }
  }

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-2">
        <Settings2 size={20} className="text-gray-600" />
        <h2 className="text-xl font-bold text-gray-800">Cài đặt CLB</h2>
      </div>

      {/* Club identity */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-700 text-sm">Thông tin CLB</h3>

        {/* Logo preview */}
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
          {form.logoUrl ? (
            <img src={form.logoUrl} alt="logo" className="w-14 h-14 rounded-xl object-cover border border-gray-200 shadow-sm" />
          ) : (
            <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center text-3xl shadow-sm">
              {form.logoEmoji}
            </div>
          )}
          <div>
            <div className="font-bold text-gray-800">{form.clubName || 'Tên CLB'}</div>
            <div className="text-xs text-gray-500 mt-0.5">{form.webTitle || 'Tiêu đề trang'}</div>
          </div>
        </div>

        {/* Logo upload */}
        <div>
          <label className="text-xs text-gray-500 font-medium">Logo CLB</label>
          <div className="mt-1.5 flex flex-col gap-2">
            {/* Upload from computer */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 border-2 border-dashed border-gray-300 hover:border-green-400 rounded-xl px-4 py-3 text-sm text-gray-600 hover:text-green-700 transition-colors w-full justify-center"
            >
              <ImagePlus size={16} />
              {uploading ? 'Đang xử lý...' : 'Upload ảnh từ máy tính'}
              <span className="text-xs text-gray-400">(JPG, PNG, max 2MB)</span>
            </button>

            {/* URL input */}
            <div className="relative">
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 pr-8"
                placeholder="Hoặc nhập URL ảnh từ internet..."
                value={form.logoUrl?.startsWith('data:') ? '' : (form.logoUrl || '')}
                onChange={e => setForm({ ...form, logoUrl: e.target.value })}
              />
              {form.logoUrl && (
                <button onClick={() => setForm({ ...form, logoUrl: '' })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                  <X size={14} />
                </button>
              )}
            </div>

            {form.logoUrl && (
              <p className="text-xs text-green-600">
                ✓ Đang dùng ảnh logo {form.logoUrl.startsWith('data:') ? '(từ máy tính)' : '(từ URL)'}
                {' — '}
                <button onClick={() => setForm({ ...form, logoUrl: '' })} className="underline text-red-400">
                  Xóa, dùng emoji
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Emoji fallback */}
        {!form.logoUrl && (
          <div>
            <label className="text-xs text-gray-500 font-medium">Emoji logo (nếu không dùng ảnh)</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {EMOJIS.map(em => (
                <button key={em}
                  onClick={() => setForm({ ...form, logoEmoji: em })}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${form.logoEmoji === em ? 'border-green-500 bg-green-50 scale-110' : 'border-gray-200 hover:border-green-300'}`}>
                  {em}
                </button>
              ))}
              <input
                className="w-14 h-10 text-center text-xl border-2 border-dashed border-gray-200 rounded-lg focus:outline-none focus:border-green-400"
                maxLength={2}
                placeholder="✏️"
                value={EMOJIS.includes(form.logoEmoji) ? '' : form.logoEmoji}
                onChange={e => setForm({ ...form, logoEmoji: e.target.value || '🏓' })}
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-gray-500 font-medium">Tên CLB</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Pickleball CLB Hà Nội"
            value={form.clubName}
            onChange={e => setForm({ ...form, clubName: e.target.value })} />
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium">Tiêu đề trình duyệt (tab title)</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Pickleball CLB Manager"
            value={form.webTitle}
            onChange={e => setForm({ ...form, webTitle: e.target.value })} />
        </div>

        <button onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-green-100 text-green-700' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
          {saved ? <><Check size={15} /> Đã lưu!</> : <><Check size={15} /> Lưu thay đổi</>}
        </button>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-gray-700 text-sm">Đổi mật khẩu Admin</h3>
        <div>
          <label className="text-xs text-gray-500 font-medium">Mật khẩu hiện tại</label>
          <div className="relative mt-1">
            <input type={showPw ? 'text' : 'password'}
              className="w-full border border-gray-200 rounded-lg px-3 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              value={currentPw} onChange={e => setCurrentPw(e.target.value)} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium">Mật khẩu mới</label>
          <div className="relative mt-1">
            <input type={showNewPw ? 'text' : 'password'}
              className="w-full border border-gray-200 rounded-lg px-3 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              value={newPw} onChange={e => setNewPw(e.target.value)} />
            <button type="button" onClick={() => setShowNewPw(!showNewPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium">Xác nhận mật khẩu mới</label>
          <input type="password"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
        </div>
        {pwError && <p className="text-xs text-red-500">{pwError}</p>}
        {pwSuccess && <p className="text-xs text-green-600 font-medium">✓ Đổi mật khẩu thành công!</p>}
        <button onClick={handleChangePassword}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <RefreshCw size={14} /> Đổi mật khẩu
        </button>
      </div>
    </div>
  )
}
