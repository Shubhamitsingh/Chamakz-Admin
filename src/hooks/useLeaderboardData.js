import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getNumericId, getUserName, toDate } from '../utils/dashboardFields'

const num = (value) => (Number.isFinite(Number(value)) && value !== '' && value != null ? Number(value) : null)

export const useLeaderboardData = () => {
  const [users, setUsers] = useState([])
  const [streams, setStreams] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!db) {
      setError('Database is not connected.')
      setLoading(false)
      return undefined
    }
    const ready = { users: false, streams: false, active: false, tx: false }
    const mark = (key) => {
      ready[key] = true
      if (ready.users && ready.streams && ready.active && ready.tx) setLoading(false)
    }

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const rows = []
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() || {}
        rows.push({
          id: docSnap.id,
          name: getUserName(data),
          numericUserId: String(getNumericId(data) === 'N/A' ? '' : getNumericId(data)),
          isHost: data.isHost === true || data.role === 'Host' || data.hostStatus === 'approved',
          photo: data.photoURL || data.profileImage || data.avatar || '',
        })
      })
      setUsers(rows)
      setError('')
      mark('users')
    }, () => {
      setError('Leaderboard records could not be loaded.')
      mark('users')
    })

    const readStreams = (snapshot, source) => {
      const rows = []
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() || {}
        const status = String(data.status || 'live').toLowerCase()
        if (status === 'cancelled' || status === 'failed') return
        rows.push({
          id: `${source}-${docSnap.id}`,
          hostId: data.hostId || data.host_id || data.userId || '',
          name: data.hostName || data.name || '',
          numericUserId: String(data.numericUserId || data.numeric_user_id || ''),
          viewCount: num(data.viewCount ?? data.viewers) || 0,
          totalViews: num(data.totalViews ?? data.total_views),
          peak: num(data.peakViewers ?? data.peakViewerCount ?? data.maxViewers),
          gifts: num(data.giftsReceived ?? data.totalGifts ?? data.giftCount) || 0,
          coins: num(data.totalCoinsEarned ?? data.total_coins_earned ?? data.coinsEarned) || 0,
          earningsInr: num(data.earningsInr ?? data.earningAmount ?? data.inrEarned),
          start: toDate(data.startTime) || toDate(data.start_time) || toDate(data.createdAt),
          end: toDate(data.endTime) || toDate(data.end_time) || toDate(data.endedAt),
          live: status === 'live',
        })
      })
      return rows
    }

    let roomRows = []
    let activeRows = []
    const publishStreams = () => {
      const seen = new Set()
      const merged = []
      ;[...roomRows, ...activeRows].forEach((row) => {
        const key = `${row.hostId}-${row.start?.getTime() || row.id}`
        if (seen.has(key)) return
        seen.add(key)
        merged.push(row)
      })
      setStreams(merged)
    }

    const unsubStreams = onSnapshot(collection(db, 'live_streams'), (snapshot) => {
      roomRows = readStreams(snapshot, 'live')
      publishStreams()
      mark('streams')
    }, () => mark('streams'))

    const unsubActive = onSnapshot(collection(db, 'active_streams'), (snapshot) => {
      activeRows = readStreams(snapshot, 'active')
      publishStreams()
      mark('active')
    }, () => mark('active'))

    const unsubTx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const rows = []
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() || {}
        rows.push({
          id: docSnap.id,
          userId: data.userId || data.uid || '',
          name: data.userName || data.name || '',
          numericUserId: String(data.numericUserId || ''),
          type: String(data.type || '').toLowerCase(),
          status: String(data.status || '').toLowerCase(),
          coins: num(data.coins ?? data.coinAmount ?? data.amount) || 0,
          inr: num(data.inr ?? data.amountInr ?? data.rupees ?? data.value),
          createdAt: toDate(data.createdAt) || toDate(data.timestamp),
        })
      })
      setTransactions(rows)
      mark('tx')
    }, () => mark('tx'))

    return () => {
      unsubUsers()
      unsubStreams()
      unsubActive()
      unsubTx()
    }
  }, [])

  return { users, streams, transactions, loading, error, now }
}
