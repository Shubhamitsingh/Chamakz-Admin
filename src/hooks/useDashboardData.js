import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { checkFirebaseConnection } from '../firebase/healthCheck'
import { isSupabaseConfigured } from '../lib/supabase'
import { dataError, dataReady, liveRows, subscribeData } from '../data/liveStore'
import {
  addDays,
  countBy,
  endOfDay,
  getAccountStatus,
  getAppVersion,
  getCity,
  getCountry,
  getGender,
  getNumericId,
  getPlatform,
  getPresetRange,
  getRegion,
  getUserName,
  inRange,
  isPremiumUser,
  isVerifiedUser,
  percentChange,
  previousRange,
  startOfDay,
  toDate,
} from '../utils/dashboardFields'

const ONLINE_WINDOW_MS = 5 * 60 * 1000
const ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000

const buildActivityHeatmap = (users, range) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const slots = ['12a', '4a', '8a', '12p', '4p', '8p']
  const cells = days.map((day) => slots.map((slot) => ({ day, slot, count: 0 })))
  users.forEach((user) => {
    if (!user.lastActive || !inRange(user.lastActive, range.start, range.end)) return
    const stamp = new Date(user.lastActive)
    const slot = Math.min(5, Math.floor(stamp.getHours() / 4))
    cells[stamp.getDay()][slot].count += 1
  })
  return { days, slots, cells }
}

const emptyAvailability = {
  gender: false,
  location: false,
  premium: false,
  verified: false,
  platform: false,
  dating: false,
  subscriptions: false,
  payments: false,
  liveHistory: false,
  hosts: false,
  gifts: false,
  recharges: false,
  agencies: false,
}

const OPTIONAL_COLLECTIONS = {
  recharges: ['recharge_requests', 'offline_recharges', 'offlineRecharges'],
  agencies: ['agencies', 'agency'],
  dating: ['matches', 'likes', 'dating_matches'],
}

const loadCollectionRows = async (names) => {
  const rows = []
  for (const name of names) {
    try {
      const snap = await getDocs(collection(db, name))
      snap.forEach((docSnap) => rows.push({ id: docSnap.id, source: name, ...docSnap.data() }))
    } catch {
      // collection may not exist
    }
  }
  return rows
}

const mapStreamDoc = (id, data, collectionName) => {
  const startTime =
    toDate(data.startTime) ||
    toDate(data.start_time) ||
    toDate(data.createdAt) ||
    toDate(data.liveStartTime)
  return {
    id,
    hostId: data.hostId || data.host_id || data.userId || id,
    hostName: getUserName(data),
    numericUserId: getNumericId(data),
    photo: data.photoURL || data.profileImage || data.avatar || '',
    room: data.roomName || data.title || data.liveRoom || 'Live room',
    viewCount: Number(data.viewCount || data.view_count || data.viewers || 0),
    gifts: Number(data.giftsReceived || data.totalGifts || data.giftCount || 0),
    coinsPerMinute: Number(data.coinsPerMinute || data.coins_per_minute || 0),
    totalCoinsEarned: Number(data.totalCoinsEarned || data.total_coins_earned || 0),
    playbackUrl: data.playbackUrl || data.streamUrl || data.hlsUrl || data.liveUrl || '',
    startTime,
    status: data.status || 'live',
    collection: collectionName,
  }
}

export const useDashboardData = ({ preset, customStart, customEnd, countryFilter, platformFilter, userTypeFilter }) => {
  const [users, setUsers] = useState([])
  const [liveStreams, setLiveStreams] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [complaints, setComplaints] = useState([])
  const [tickets, setTickets] = useState([])
  const [chats, setChats] = useState([])
  const [transactions, setTransactions] = useState([])
  const [hostApps, setHostApps] = useState([])
  const [gifts, setGifts] = useState([])
  const [recharges, setRecharges] = useState([])
  const [agencies, setAgencies] = useState([])
  const [datingEvents, setDatingEvents] = useState([])
  const [health, setHealth] = useState({ firebase: 'checking', auth: 'unknown', mock: false, error: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [availability, setAvailability] = useState(emptyAvailability)
  const [lastUpdated, setLastUpdated] = useState(null)

  const range = useMemo(
    () => getPresetRange(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  )
  const compareRange = useMemo(() => previousRange(range.start, range.end), [range])

  useEffect(() => {
    if (isSupabaseConfigured) {
      const apply = () => {
        const profiles = liveRows('profiles')
        setUsers(profiles.map((user) => ({
          id: user.id,
          data: user,
          name: user.name,
          numericUserId: user.numericId,
          photo: '',
          createdAt: user.registeredAt,
          lastActive: user.lastActive,
          gender: user.gender,
          country: user.country,
          city: user.city,
          region: user.state,
          status: user.status,
          verified: user.verification === 'Verified',
          premium: user.vip,
          platform: user.platform,
          appVersion: user.appVersion,
          isLive: false,
          isHost: user.isHost,
          coins: user.coins,
        })))
        setWithdrawals(liveRows('withdrawals'))
        setComplaints(liveRows('complaints'))
        setTickets(liveRows('tickets'))
        setChats(liveRows('chats'))
        setHostApps(liveRows('hostApplications'))
        setGifts(liveRows('gifts'))
        setLiveStreams(liveRows('liveSessions').filter((row) => row.status === 'live'))
        setTransactions(liveRows('payments'))
        setLoading(!dataReady())
        setError(dataError() || null)
        setHealth({ firebase: 'not-used', auth: 'supabase', mock: false, error: dataError() || null })
        setLastUpdated(new Date())
      }
      apply()
      return subscribeData(apply)
    }
    if (!db) {
      setError('Firebase is not initialized')
      setLoading(false)
      return undefined
    }

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const mapped = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() || {}
          return {
            id: docSnap.id,
            data,
            name: getUserName(data),
            numericUserId: getNumericId(data),
            photo: data.photoURL || data.profileImage || data.avatar || '',
            createdAt: toDate(data.createdAt) || toDate(data.created_at) || toDate(data.joinedAt),
            lastActive: toDate(data.lastActive) || toDate(data.last_active) || toDate(data.lastSeen),
            gender: getGender(data),
            country: getCountry(data),
            city: getCity(data),
            region: getRegion(data),
            status: getAccountStatus(data),
            verified: isVerifiedUser(data),
            premium: isPremiumUser(data),
            platform: getPlatform(data),
            appVersion: getAppVersion(data),
            isLive: data.isLive === true,
            isHost: data.role === 'Host' || data.isActive === true || Boolean(data.liveApprovalCode),
            coins: Number(data.ucoin ?? data.coins ?? 0),
          }
        })
        setUsers(mapped)
        setAvailability((prev) => ({
          ...prev,
          gender: mapped.some((user) => user.gender),
          location: mapped.some((user) => user.country || user.city || user.region),
          premium: mapped.some((user) => user.data.isPremium != null || user.data.premium != null || user.data.subscriptionStatus),
          verified: mapped.some((user) => user.data.verified != null || user.data.isVerified != null || user.data.kycStatus),
          platform: mapped.some((user) => user.platform),
        }))
        setLastUpdated(new Date())
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    const unsubWithdrawals = onSnapshot(
      collection(db, 'withdrawal_requests'),
      (snapshot) => setWithdrawals(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))),
      () => setWithdrawals([])
    )

    const unsubComplaints = onSnapshot(
      collection(db, 'complaints'),
      (snapshot) => setComplaints(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))),
      () => setComplaints([])
    )

    const unsubTickets = onSnapshot(
      collection(db, 'supportTickets'),
      (snapshot) => setTickets(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))),
      () => setTickets([])
    )

    const unsubChats = onSnapshot(
      collection(db, 'supportChats'),
      (snapshot) => setChats(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))),
      () => setChats([])
    )

    const unsubHosts = onSnapshot(
      collection(db, 'hosts_application'),
      (snapshot) => {
        setHostApps(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })))
        setAvailability((prev) => ({ ...prev, hosts: snapshot.size > 0 }))
      },
      () => setHostApps([])
    )

    const unsubGifts = onSnapshot(
      collection(db, 'gifts'),
      (snapshot) => {
        setGifts(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })))
        setAvailability((prev) => ({ ...prev, gifts: snapshot.size > 0 }))
      },
      () => setGifts([])
    )

    return () => {
      unsubUsers()
      unsubWithdrawals()
      unsubComplaints()
      unsubTickets()
      unsubChats()
      unsubHosts()
      unsubGifts()
    }
  }, [])

  useEffect(() => {
    if (!db) return undefined
    let cancelled = false

    const loadLive = async () => {
      const streams = []
      const seen = new Set()

      const pushUnique = (stream) => {
        const key = stream.hostId || stream.id
        if (seen.has(key)) return
        seen.add(key)
        streams.push(stream)
      }

      try {
        const liveSnap = await getDocs(query(collection(db, 'live_streams'), where('status', '==', 'live')))
        liveSnap.forEach((docSnap) => pushUnique(mapStreamDoc(docSnap.id, docSnap.data(), 'live_streams')))
        if (!cancelled && liveSnap.size > 0) {
          setAvailability((prev) => ({ ...prev, liveHistory: true }))
        }
      } catch {
        // collection may not exist
      }

      users
        .filter((user) => user.isLive)
        .forEach((user) => {
          const liveData = user.data.liveStreamData || user.data.live_stream_data || {}
          pushUnique(
            mapStreamDoc(
              user.id,
              {
                ...liveData,
                name: user.name,
                numericUserId: user.numericUserId,
                photoURL: user.photo,
                startTime: liveData.startTime || user.data.liveStartTime,
              },
              'users'
            )
          )
        })

      try {
        const activeSnap = await getDocs(query(collection(db, 'active_streams'), where('status', '==', 'live')))
        activeSnap.forEach((docSnap) => pushUnique(mapStreamDoc(docSnap.id, docSnap.data(), 'active_streams')))
      } catch {
        // collection may not exist
      }

      if (!cancelled) setLiveStreams(streams)
    }

    loadLive()
    const timer = setInterval(loadLive, 15000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [users])

  useEffect(() => {
    if (!db) return undefined
    let cancelled = false

    const loadTransactions = async () => {
      const names = ['transactions', 'coin_transactions']
      const rows = []
      for (const name of names) {
        try {
          const snap = await getDocs(collection(db, name))
          snap.forEach((docSnap) => {
            const data = docSnap.data()
            rows.push({
              id: `${name}-${docSnap.id}`,
              source: name,
              type: String(data.type || data.transactionType || '').toLowerCase(),
              amount: Number(data.amount || 0),
              value: Number(data.value || data.fiatAmount || data.amount || 0),
              status: String(data.status || 'unknown').toLowerCase(),
              method: data.method || data.paymentMethod || data.gateway || null,
              userId: data.userId || data.hostId || '',
              userName: data.userName || data.hostName || data.name || 'Unknown',
              createdAt: toDate(data.createdAt) || toDate(data.timestamp),
            })
          })
          if (snap.size > 0 && !cancelled) {
            setAvailability((prev) => ({ ...prev, payments: true }))
          }
        } catch {
          // skip missing collections
        }
      }
      if (!cancelled) setTransactions(rows)
    }

    loadTransactions()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!db) return undefined
    let cancelled = false

    const loadOptional = async () => {
      const rechargeRows = await loadCollectionRows(OPTIONAL_COLLECTIONS.recharges)
      const agencyRows = await loadCollectionRows(OPTIONAL_COLLECTIONS.agencies)
      const datingRows = await loadCollectionRows(OPTIONAL_COLLECTIONS.dating)
      if (cancelled) return
      setRecharges(rechargeRows)
      setAgencies(agencyRows)
      setDatingEvents(datingRows)
      setAvailability((prev) => ({
        ...prev,
        recharges: rechargeRows.length > 0,
        agencies: agencyRows.length > 0,
        dating: datingRows.length > 0,
      }))
    }

    loadOptional()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    checkFirebaseConnection().then((result) => {
      if (cancelled) return
      setHealth({
        firebase: result.ok ? 'ok' : 'error',
        auth: 'ok',
        mock: Boolean(result.mock),
        error: result.error || null,
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const metrics = useMemo(() => {
    const now = new Date()
    const todayStart = startOfDay(now)
    const weekStart = addDays(todayStart, -6)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const yesterdayStart = addDays(todayStart, -1)

    const matchesCountry = (user) =>
      !countryFilter || countryFilter === 'all' || user.country === countryFilter
    const matchesPlatform = (user) =>
      !platformFilter || platformFilter === 'all' || user.platform === platformFilter
    const matchesType = (user) => {
      if (!userTypeFilter || userTypeFilter === 'all') return true
      if (userTypeFilter === 'host') return user.isHost
      if (userTypeFilter === 'user') return !user.isHost
      return true
    }

    const filteredUsers = users.filter((user) => matchesCountry(user) && matchesPlatform(user) && matchesType(user))
    const onlineUsers = filteredUsers.filter(
      (user) => user.lastActive && now - user.lastActive <= ONLINE_WINDOW_MS
    )
    const activeUsers = filteredUsers.filter(
      (user) => user.lastActive && now - user.lastActive <= ACTIVE_WINDOW_MS
    )

    const createdIn = (start, end) =>
      filteredUsers.filter((user) => inRange(user.createdAt, start, end)).length

    const newToday = createdIn(todayStart, now)
    const newYesterday = createdIn(yesterdayStart, todayStart)
    const newWeek = createdIn(weekStart, now)
    const newMonth = createdIn(monthStart, now)
    const newInRange = createdIn(range.start, range.end)
    const newInPrev = createdIn(compareRange.start, compareRange.end)

    const statusCounts = {
      active: filteredUsers.filter((user) => user.status === 'active').length,
      blocked: filteredUsers.filter((user) => user.status === 'blocked').length,
      suspended: filteredUsers.filter((user) => user.status === 'suspended').length,
      banned: filteredUsers.filter((user) => user.status === 'banned').length,
    }

    const genderCounts = {
      male: filteredUsers.filter((user) => user.gender === 'male').length,
      female: filteredUsers.filter((user) => user.gender === 'female').length,
      other: filteredUsers.filter((user) => user.gender === 'other').length,
      undisclosed: filteredUsers.filter((user) => !user.gender).length,
    }

    const sparkline = []
    for (let i = 6; i >= 0; i -= 1) {
      const day = addDays(todayStart, -i)
      sparkline.push(createdIn(day, endOfDay(day)))
    }

    const activitySeries = []
    const days = Math.min(30, Math.max(1, Math.ceil((range.end - range.start) / 86400000)))
    const chartDays = days > 14 ? 14 : days
    for (let i = chartDays - 1; i >= 0; i -= 1) {
      const day = addDays(startOfDay(range.end), -i)
      activitySeries.push({
        name: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: createdIn(day, endOfDay(day)),
        active: filteredUsers.filter((user) => inRange(user.lastActive, day, endOfDay(day))).length,
      })
    }

    const rangeTx = transactions.filter((row) => inRange(row.createdAt, range.start, range.end))
    const prevTx = transactions.filter((row) => inRange(row.createdAt, compareRange.start, compareRange.end))
    const todayTx = transactions.filter((row) => inRange(row.createdAt, todayStart, now))

    const sumValue = (rows, predicate) =>
      rows.reduce((sum, row) => (predicate(row) ? sum + (row.value || 0) : sum), 0)
    const sumAmount = (rows, predicate) =>
      rows.reduce((sum, row) => (predicate(row) ? sum + (row.amount || 0) : sum), 0)

    const isPurchase = (row) => ['purchase', 'credit', 'payment'].includes(row.type)
    const isSpend = (row) => ['spend', 'debit', 'gift'].includes(row.type)
    const isRefund = (row) => row.type.includes('refund') || row.status === 'refunded'

    const revenueSeries = activitySeries.map((point, index) => {
      const day = addDays(startOfDay(range.end), -(activitySeries.length - 1 - index))
      const dayRows = transactions.filter((row) => inRange(row.createdAt, day, endOfDay(day)))
      return {
        name: point.name,
        revenue: Math.round(sumValue(dayRows, isPurchase)),
        coins: sumAmount(dayRows, isPurchase),
      }
    })

    const liveSeries = activitySeries.map((point, index) => {
      const day = addDays(startOfDay(range.end), -(activitySeries.length - 1 - index))
      const dayStreams = liveStreams.filter((stream) => inRange(stream.startTime, day, endOfDay(day)))
      return {
        name: point.name,
        viewers: dayStreams.reduce((sum, stream) => sum + (stream.viewCount || 0), 0),
        gifts: dayStreams.reduce((sum, stream) => sum + (stream.gifts || 0), 0),
        rooms: dayStreams.length,
      }
    })

    const pendingWithdrawals = withdrawals.filter((item) =>
      ['pending', 'processing'].includes(String(item.status || '').toLowerCase())
    )
    const completedWithdrawals = withdrawals.filter((item) =>
      ['approved', 'completed', 'paid'].includes(String(item.status || '').toLowerCase())
    )

    const pendingReports = complaints.filter((item) =>
      ['pending', 'open', 'new', ''].includes(String(item.status || 'pending').toLowerCase())
    )
    const openTickets = tickets.filter((item) =>
      ['open', 'pending', 'in-progress', 'new'].includes(String(item.status || 'open').toLowerCase())
    )

    const countries = countBy(
      filteredUsers.filter((user) => user.country),
      (user) => user.country
    )
    const cities = countBy(
      filteredUsers.filter((user) => user.city),
      (user) => user.city
    )
    const platforms = countBy(
      filteredUsers.filter((user) => user.platform),
      (user) => user.platform
    )
    const versions = countBy(
      filteredUsers.filter((user) => user.appVersion),
      (user) => user.appVersion
    )

    const topHosts = [...filteredUsers]
      .filter((user) => user.isHost)
      .sort((a, b) => b.coins - a.coins)
      .slice(0, 10)

    const mostActive = [...filteredUsers]
      .filter((user) => user.lastActive)
      .sort((a, b) => b.lastActive - a.lastActive)
      .slice(0, 10)

    const activity = [
      ...filteredUsers
        .filter((user) => user.createdAt)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 8)
        .map((user) => ({
          id: `user-${user.id}`,
          type: 'user',
          title: user.name,
          detail: 'New registration',
          time: user.createdAt,
          href: '/users',
        })),
      ...pendingWithdrawals.slice(0, 5).map((item) => ({
        id: `wd-${item.id}`,
        type: 'withdrawal',
        title: item.hostName || item.userName || 'Host',
        detail: 'Withdrawal request',
        time: toDate(item.createdAt) || toDate(item.timestamp),
        href: '/transactions',
      })),
      ...pendingReports.slice(0, 5).map((item) => ({
        id: `rep-${item.id}`,
        type: 'report',
        title: item.reportedName || item.targetName || 'Reported user',
        detail: item.reason || item.category || 'Safety report',
        time: toDate(item.createdAt) || toDate(item.timestamp),
        href: '/complaints',
      })),
    ]
      .sort((a, b) => (b.time?.getTime?.() || 0) - (a.time?.getTime?.() || 0))
      .slice(0, 12)

    const liveViewers = liveStreams.reduce((sum, stream) => sum + (stream.viewCount || 0), 0)
    const mauUsers = filteredUsers.filter(
      (user) => user.lastActive && now - user.lastActive <= 30 * 24 * 60 * 60 * 1000
    )
    const monthTx = transactions.filter((row) => inRange(row.createdAt, monthStart, now))
    const pendingHostApps = hostApps.filter((item) =>
      ['pending', 'new', 'submitted', ''].includes(String(item.status || 'pending').toLowerCase())
    )
    const highPriorityReports = pendingReports.filter((item) =>
      ['high', 'urgent', 'critical'].includes(String(item.priority || '').toLowerCase())
    )
    const liveReports = complaints.filter((item) =>
      `${item.reason || ''} ${item.category || ''}`.toLowerCase().includes('live')
    )
    const isPromo = (row) => ['promo', 'bonus', 'promotional', 'grant'].includes(row.type)
    const pendingRecharges = recharges.filter((item) =>
      ['pending', 'submitted', 'new', 'unverified'].includes(String(item.status || 'pending').toLowerCase())
    )
    const approvedRecharges = recharges.filter((item) =>
      ['approved', 'completed', 'paid', 'verified'].includes(String(item.status || '').toLowerCase())
    )
    const rejectedRecharges = recharges.filter((item) =>
      ['rejected', 'declined', 'failed'].includes(String(item.status || '').toLowerCase())
    )
    const giftSpend = sumAmount(rangeTx, isSpend)
    const catalogGiftUses = gifts.reduce((sum, gift) => sum + Number(gift.usageCount || 0), 0)
    const activeHosts = filteredUsers.filter(
      (user) => user.isHost && user.lastActive && now - user.lastActive <= ACTIVE_WINDOW_MS
    )
    const hostEarningsProxy = topHosts.reduce((sum, user) => sum + (user.coins || 0), 0)

    const richerActivity = [
      ...activity,
      ...pendingHostApps.slice(0, 4).map((item) => ({
        id: `host-${item.id}`,
        type: 'host',
        title: item.userName || item.name || 'Host applicant',
        detail: 'Host application pending',
        time: toDate(item.createdAt) || toDate(item.timestamp),
        href: '/host-applications',
      })),
      ...liveStreams.slice(0, 3).map((stream) => ({
        id: `live-${stream.id}`,
        type: 'live',
        title: stream.hostName,
        detail: `Went live · ${stream.viewCount} viewers`,
        time: stream.startTime,
        href: '/dashboard',
      })),
      ...openTickets.slice(0, 3).map((item) => ({
        id: `tkt-${item.id}`,
        type: 'ticket',
        title: item.subject || item.issue || 'Support ticket',
        detail: item.userName || 'Ticket opened',
        time: toDate(item.createdAt),
        href: '/tickets',
      })),
    ]
      .sort((a, b) => (b.time?.getTime?.() || 0) - (a.time?.getTime?.() || 0))
      .slice(0, 14)

    return {
      totalUsers: filteredUsers.length,
      onlineUsers: onlineUsers.length,
      offlineUsers: Math.max(filteredUsers.length - onlineUsers.length, 0),
      activeUsers: activeUsers.length,
      mauUsers: mauUsers.length,
      newToday,
      newYesterday,
      newWeek,
      newMonth,
      newInRange,
      newInPrev,
      statusCounts,
      genderCounts,
      verified: filteredUsers.filter((user) => user.verified).length,
      unverified: filteredUsers.filter((user) => !user.verified).length,
      premium: filteredUsers.filter((user) => user.premium).length,
      free: filteredUsers.filter((user) => !user.premium).length,
      hosts: filteredUsers.filter((user) => user.isHost).length,
      activeHosts: activeHosts.length,
      sparkline,
      activeSparkline: activitySeries.map((point) => point.active),
      revenueSparkline: revenueSeries.map((point) => point.revenue),
      activityHeatmap: buildActivityHeatmap(filteredUsers, range),
      activitySeries,
      revenueSeries,
      liveSeries,
      countries,
      cities,
      platforms,
      versions,
      topHosts,
      mostActive,
      activity: richerActivity,
      liveViewers,
      liveRooms: liveStreams.length,
      hostDirectory: filteredUsers.map((user) => ({
        id: user.id,
        name: user.name,
        numericUserId: String(user.numericUserId || ''),
        isLive: Boolean(user.isLive),
      })),
      topLiveByViewers: [...liveStreams].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5),
      topLiveByGifts: [...liveStreams].sort((a, b) => (b.gifts || b.totalCoinsEarned || 0) - (a.gifts || a.totalCoinsEarned || 0)).slice(0, 5),
      pendingWithdrawals: pendingWithdrawals.length,
      pendingWithdrawalAmount: pendingWithdrawals.reduce((sum, item) => sum + Number(item.amount || item.coins || 0), 0),
      completedWithdrawals: completedWithdrawals.length,
      pendingReports: pendingReports.length,
      highPriorityReports: highPriorityReports.length,
      recentReports: [...complaints]
        .sort((a, b) => (toDate(b.createdAt)?.getTime?.() || 0) - (toDate(a.createdAt)?.getTime?.() || 0))
        .slice(0, 6)
        .map((item) => ({
          id: item.id,
          reported: item.reportedName || item.targetName || 'Unknown',
          reporter: item.reporterName || 'Anonymous',
          reason: item.reason || item.category || 'Report',
          status: String(item.status || 'pending'),
          priority: String(item.priority || 'medium'),
          time: toDate(item.createdAt) || toDate(item.timestamp),
        })),
      recentTickets: [...tickets]
        .sort((a, b) => (toDate(b.createdAt)?.getTime?.() || 0) - (toDate(a.createdAt)?.getTime?.() || 0))
        .slice(0, 4)
        .map((item) => ({
          id: item.id,
          title: item.subject || item.issue || 'Ticket',
          user: item.userName || 'User',
          status: String(item.status || 'open'),
          time: toDate(item.createdAt),
        })),
      investigatingReports: complaints.filter((item) =>
        ['investigating', 'in-progress', 'review'].includes(String(item.status || '').toLowerCase())
      ).length,
      liveReports: liveReports.length,
      openTickets: openTickets.length,
      openChats: chats.filter((item) => String(item.status || 'active').toLowerCase() !== 'closed').length,
      unreadChats: chats.filter((item) => Number(item.unreadByAdmin || 0) > 0).length,
      pendingHostApps: pendingHostApps.length,
      hostApps: hostApps.length,
      agencies: agencies.length,
      giftCatalog: gifts.length,
      catalogGiftUses,
      pendingRecharges: pendingRecharges.length,
      approvedRecharges: approvedRecharges.length,
      rejectedRecharges: rejectedRecharges.length,
      rechargeVolume: recharges.reduce((sum, item) => sum + Number(item.amount || item.coins || item.value || 0), 0),
      datingEvents: datingEvents.length,
      revenueInRange: sumValue(rangeTx, isPurchase),
      revenuePrev: sumValue(prevTx, isPurchase),
      revenueToday: sumValue(todayTx, isPurchase),
      revenueMonth: sumValue(monthTx, isPurchase),
      coinsPurchased: sumAmount(rangeTx, isPurchase),
      coinsSpent: giftSpend,
      promoCoins: sumAmount(rangeTx, isPromo),
      refunds: sumValue(rangeTx, isRefund),
      failedPayments: rangeTx.filter((row) => ['failed', 'error', 'declined'].includes(row.status)).length,
      successfulPayments: rangeTx.filter((row) => ['success', 'paid', 'completed'].includes(row.status)).length,
      hostWalletProxy: hostEarningsProxy,
      recentTransactions: [...rangeTx].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 8),
      paymentMethods: countBy(rangeTx.filter((row) => row.method), (row) => row.method),
      arpu: filteredUsers.length ? sumValue(rangeTx, isPurchase) / filteredUsers.length : 0,
      newTodayChange: percentChange(newToday, newYesterday),
      rangeUserChange: percentChange(newInRange, newInPrev),
      revenueChange: percentChange(sumValue(rangeTx, isPurchase), sumValue(prevTx, isPurchase)),
      dauChange: percentChange(activeUsers.length, filteredUsers.filter((user) => inRange(user.lastActive, addDays(todayStart, -1), yesterdayStart)).length),
      countryOptions: countries.map((item) => item.label),
      platformOptions: platforms.map((item) => item.label),
    }
  }, [users, liveStreams, withdrawals, complaints, tickets, chats, transactions, hostApps, gifts, recharges, agencies, datingEvents, range, compareRange, countryFilter, platformFilter, userTypeFilter])

  return {
    loading,
    error,
    health,
    availability,
    lastUpdated,
    liveStreams,
    metrics,
    range,
  }
}
