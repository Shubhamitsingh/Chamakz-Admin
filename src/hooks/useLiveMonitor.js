import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getNumericId, getUserName, toDate } from '../utils/dashboardFields'

const isApprovedHost = (data = {}) =>
  data.isHost === true || data.role === 'Host' || data.hostStatus === 'approved'

const numberOrNull = (value) => (Number.isFinite(Number(value)) && value !== '' && value != null ? Number(value) : null)

const roomFrom = (id, data) => {
  const viewCount = Number(data.viewCount || data.view_count || data.viewers || 0)
  return {
    hostId: data.hostId || data.host_id || data.userId || id,
    viewCount: Number.isFinite(viewCount) ? viewCount : 0,
    title: data.streamTitle || data.title || data.roomName || data.liveRoom || '',
    startTime: toDate(data.startTime) || toDate(data.start_time) || toDate(data.createdAt) || toDate(data.liveStartTime),
    peakViewers: numberOrNull(data.peakViewers ?? data.peakViewerCount ?? data.maxViewers),
    totalViews: numberOrNull(data.totalViews ?? data.total_views),
    totalStreams: numberOrNull(data.totalStreams ?? data.streamCount),
    coinsEarned: numberOrNull(data.totalCoinsEarned ?? data.total_coins_earned ?? data.coinsEarned ?? data.earnedCoins),
  }
}

const hostFromUser = (id, data) => ({
  id,
  hostId: id,
  hostName: getUserName(data),
  numericUserId: String(getNumericId(data) === 'N/A' ? '' : getNumericId(data)),
  photo: data.photoURL || data.profileImage || data.avatar || '',
  isLive: false,
  viewCount: 0,
  title: '',
  startTime: null,
  peakViewers: numberOrNull(data.peakViewers),
  totalViews: numberOrNull(data.totalViews),
  totalStreams: numberOrNull(data.totalStreams ?? data.streamCount),
  coinsEarned: numberOrNull(data.totalCoinsEarned ?? data.total_coins_earned ?? data.coinsEarned ?? data.earnedCoins),
})

export const useLiveMonitor = () => {
  const [hosts, setHosts] = useState([])
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

    const buckets = { users: [], rooms: [], active: [] }
    const ready = { users: false, rooms: false, active: false }

    const publish = () => {
      const liveByHost = new Map()
      ;[...buckets.rooms, ...buckets.active].forEach((room) => {
        if (!liveByHost.has(room.hostId)) liveByHost.set(room.hostId, room)
      })

      const seen = new Set()
      const rows = []

      buckets.users.filter((user) => user.approved).forEach((user) => {
        const live = liveByHost.get(user.id) || (user.isLiveFlag ? {
          viewCount: user.liveViewCount,
          title: user.liveTitle,
          startTime: user.liveStart,
          peakViewers: null,
          totalViews: null,
          totalStreams: null,
          coinsEarned: user.liveCoins,
        } : null)
        seen.add(user.id)
        rows.push({
          ...user.profile,
          isLive: Boolean(live),
          viewCount: live?.viewCount || 0,
          title: live?.title || '',
          startTime: live?.startTime || null,
          peakViewers: live?.peakViewers ?? user.profile.peakViewers,
          totalViews: live?.totalViews ?? user.profile.totalViews,
          totalStreams: live?.totalStreams ?? user.profile.totalStreams,
          coinsEarned: live?.coinsEarned ?? user.profile.coinsEarned,
        })
      })

      liveByHost.forEach((room, hostId) => {
        if (seen.has(hostId)) return
        const user = buckets.users.find((row) => row.id === hostId)
        rows.push({
          id: hostId,
          hostId,
          hostName: user?.profile.hostName || 'Host',
          numericUserId: user?.profile.numericUserId || '',
          photo: user?.profile.photo || '',
          isLive: true,
          viewCount: room.viewCount,
          title: room.title,
          startTime: room.startTime,
          peakViewers: room.peakViewers,
          totalViews: room.totalViews,
          totalStreams: room.totalStreams,
          coinsEarned: room.coinsEarned,
        })
      })

      setHosts(rows)
      if (ready.users && ready.rooms && ready.active) setLoading(false)
    }

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      buckets.users = []
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() || {}
        const liveData = data.liveStreamData || data.live_stream_data || {}
        buckets.users.push({
          id: docSnap.id,
          approved: isApprovedHost(data),
          isLiveFlag: data.isLive === true,
          liveViewCount: Number(liveData.viewCount || 0),
          liveTitle: liveData.roomName || liveData.title || '',
          liveStart: toDate(liveData.startTime) || toDate(data.liveStartTime),
          liveCoins: numberOrNull(liveData.totalCoinsEarned ?? liveData.total_coins_earned ?? liveData.coinsEarned),
          profile: hostFromUser(docSnap.id, data),
        })
      })
      ready.users = true
      setError('')
      publish()
    }, () => {
      ready.users = true
      setError('Live host list could not be loaded.')
      publish()
    })

    const watchRooms = (ref, key) => onSnapshot(ref, (snapshot) => {
      buckets[key] = []
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() || {}
        const status = String(data.status || 'live').toLowerCase()
        if (status !== 'live') return
        buckets[key].push(roomFrom(docSnap.id, data))
      })
      ready[key] = true
      publish()
    }, () => {
      ready[key] = true
      publish()
    })

    const unsubRooms = watchRooms(query(collection(db, 'live_streams'), where('status', '==', 'live')), 'rooms')
    const unsubActive = watchRooms(query(collection(db, 'active_streams'), where('status', '==', 'live')), 'active')

    return () => {
      unsubUsers()
      unsubRooms()
      unsubActive()
    }
  }, [])

  return { hosts, loading, error, now }
}
