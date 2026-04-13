import { useState, useEffect } from 'react'
import { genId } from './utils'

const STORAGE_KEY = 'pickleball_manager_data'

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
    password: 'admin',
  },
}

export function useStore() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return defaultData
      const parsed = JSON.parse(saved)
      // If no players saved yet, load defaults
      if (!parsed.players || parsed.players.length === 0) {
        return { ...defaultData, ...parsed, players: DEFAULT_PLAYERS }
      }
      return { ...defaultData, ...parsed }
    } catch {
      return defaultData
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const update = (key, value) =>
    setData(prev => ({ ...prev, [key]: value }))

  return { data, update }
}
