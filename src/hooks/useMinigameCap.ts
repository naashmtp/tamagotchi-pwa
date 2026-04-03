const STORAGE_KEY = 'minigame_daily'
const MAX_PLAYS = 5

interface DailyRecord {
  date: string // YYYY-MM-DD
  count: number
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function loadRecord(): DailyRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { date: todayStr(), count: 0 }
    const record = JSON.parse(raw) as DailyRecord
    if (record.date !== todayStr()) return { date: todayStr(), count: 0 }
    return record
  } catch {
    return { date: todayStr(), count: 0 }
  }
}

export function getPlaysLeft(): number {
  return Math.max(0, MAX_PLAYS - loadRecord().count)
}

export function recordPlay(): void {
  const record = loadRecord()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: record.date, count: record.count + 1 }))
}
