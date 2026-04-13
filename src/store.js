import { useState, useEffect, useRef } from 'react'
import { genId } from './utils'

const DEFAULT_PLAYERS = [
  { name: 'Alex', level: 'A' },
  { name: 'Dũng Bệu', level: 'B' },
  { name: 'Phúc', level: 'B' },
  { name: 'Tiệp', level: 'B' },
  { name: 'Công', level: 'A' },
  { name: 'Hải Bé Bỏng', level: 'A' },
  { name: 'Sĩ Hoà', level: 'B' },
  { name: 'Duy', level: 'A' },
  { name: 'Bạch', level: 'B' },
  { name: 'Hiệp Flame', level: 'A' },
  { name: 'Tâm', level: 'A' },
  { name: 'Hải Lú', level: 'B' },
  { name: 'Tuyến', level: 'B' },
  { name: 'Ngọc Sơn', level: 'A' },
  { name: 'Phú', level: 'B' },
  { name: 'Hùng', level: 'A' },
  { name: 'Sang', level: 'A' },
  { name: 'Tài Bò', level: 'A' },
  { name: 'Thắng Mixue', level: 'A' },
  { name: 'Tuda', level: 'A' },
  { name: 'Duy Dũng', level: 'B' },
  { name: 'Phước', level: 'B' },
  { name: 'Vinh', level: 'B' },
  { name: 'Xuân Tuấn', level: 'A' },
  { name: 'Xuân Tài', level: 'A' },
  { name: 'Đoàn', level: 'B' },
].map(p => ({ id: genId(), ...p, phone: '', note: '', joinedAt: new Date().toISOString() }))

const defaultData = {
  players: DEFAULT_PLAYERS,
  tournaments: [],
  matches: [],
  transactions: [],
  settings: {
    clubName: 'Pickleball CLB',
    logoEmoji: '🏓',
    logoUrl: '',
    webTitle: 'Pickleball CLB Manager',
  },
}

// Debounce helper
function useDebouncedCallback(fn, delay) {
  const timer = useRef(null)
  return (...args) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }
}

export function useStore() {
  const [data, setData] = useState(defaultData)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  // Load data from API on mount
  useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(remote => {
        if (remote) {
          setData(prev => ({
            ...defaultData,
            ...remote,
            settings: { ...defaultData.settings, ...remote.settings },
            players: remote.players?.length ? remote.players : defaultData.players,
          }))
        }
        initialized.current = true
        setLoading(false)
      })
      .catch(() => {
        initialized.current = true
        setLoading(false)
      })
  }, [])

  // Save to API (debounced 1s) whenever data changes after init
  const saveToApi = useDebouncedCallback((newData) => {
    const token = sessionStorage.getItem('pb_token')
    if (!token) return
    fetch('/api/data', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newData),
    }).catch(console.error)
  }, 1000)

  const update = (key, value) => {
    setData(prev => {
      const next = { ...prev, [key]: value }
      if (initialized.current) saveToApi(next)
      return next
    })
  }

  return { data, update, loading }
}
