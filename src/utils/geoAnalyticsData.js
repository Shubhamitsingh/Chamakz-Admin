const RANGE_SCALE = {
  today: 0.09,
  '7d': 0.32,
  '30d': 1,
  '90d': 2.45,
}

const monthLabels = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']

const dayLabels = Array.from({ length: 14 }, (_, index) => {
  const date = new Date()
  date.setDate(date.getDate() - (13 - index))
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
})

export const GEO_COUNTRIES = ['India', 'UAE', 'Singapore', 'United Kingdom']

export const GEO_STATES = [
  {
    name: 'Maharashtra',
    country: 'India',
    users: 18420,
    active: 6120,
    neu: 840,
    growth: 18.4,
    region: 'West',
    cities: [
      { name: 'Mumbai', users: 7420, active: 2680, neu: 310, growth: 16.2 },
      { name: 'Pune', users: 5280, active: 1840, neu: 260, growth: 22.1 },
      { name: 'Nagpur', users: 3120, active: 920, neu: 150, growth: 14.8 },
      { name: 'Nashik', users: 2600, active: 680, neu: 120, growth: 11.4 },
    ],
  },
  {
    name: 'Karnataka',
    country: 'India',
    users: 15110,
    active: 5340,
    neu: 790,
    growth: 21.6,
    region: 'South',
    cities: [
      { name: 'Bengaluru', users: 9100, active: 3420, neu: 480, growth: 24.8 },
      { name: 'Mysuru', users: 3280, active: 1080, neu: 170, growth: 15.2 },
      { name: 'Mangaluru', users: 2730, active: 840, neu: 140, growth: 12.6 },
    ],
  },
  {
    name: 'Delhi',
    country: 'India',
    users: 12840,
    active: 4980,
    neu: 610,
    growth: 14.2,
    region: 'North',
    cities: [
      { name: 'New Delhi', users: 8640, active: 3520, neu: 420, growth: 13.8 },
      { name: 'Dwarka', users: 4200, active: 1460, neu: 190, growth: 15.1 },
    ],
  },
  {
    name: 'Tamil Nadu',
    country: 'India',
    users: 11960,
    active: 4010,
    neu: 540,
    growth: 12.9,
    region: 'South',
    cities: [
      { name: 'Chennai', users: 6380, active: 2210, neu: 280, growth: 11.4 },
      { name: 'Coimbatore', users: 3120, active: 1040, neu: 150, growth: 16.8 },
      { name: 'Madurai', users: 2460, active: 760, neu: 110, growth: 10.2 },
    ],
  },
  {
    name: 'Uttar Pradesh',
    country: 'India',
    users: 10840,
    active: 3220,
    neu: 670,
    growth: 19.8,
    region: 'North',
    cities: [
      { name: 'Noida', users: 3480, active: 1260, neu: 220, growth: 26.4 },
      { name: 'Lucknow', users: 3010, active: 880, neu: 180, growth: 17.2 },
      { name: 'Kanpur', users: 2340, active: 620, neu: 140, growth: 13.1 },
      { name: 'Varanasi', users: 2010, active: 460, neu: 130, growth: 18.6 },
    ],
  },
  {
    name: 'Gujarat',
    country: 'India',
    users: 9720,
    active: 3180,
    neu: 430,
    growth: 15.5,
    region: 'West',
    cities: [
      { name: 'Ahmedabad', users: 4120, active: 1480, neu: 180, growth: 14.2 },
      { name: 'Surat', users: 3280, active: 1040, neu: 150, growth: 19.4 },
      { name: 'Vadodara', users: 2320, active: 660, neu: 100, growth: 11.8 },
    ],
  },
  {
    name: 'Telangana',
    country: 'India',
    users: 9050,
    active: 3360,
    neu: 510,
    growth: 23.1,
    region: 'South',
    cities: [
      { name: 'Hyderabad', users: 7240, active: 2780, neu: 410, growth: 24.6 },
      { name: 'Warangal', users: 1810, active: 580, neu: 100, growth: 16.2 },
    ],
  },
  {
    name: 'Rajasthan',
    country: 'India',
    users: 7640,
    active: 2140,
    neu: 360,
    growth: 13.4,
    region: 'West',
    cities: [
      { name: 'Jaipur', users: 3920, active: 1210, neu: 190, growth: 15.8 },
      { name: 'Udaipur', users: 1980, active: 520, neu: 90, growth: 10.6 },
      { name: 'Jodhpur', users: 1740, active: 410, neu: 80, growth: 11.1 },
    ],
  },
  {
    name: 'West Bengal',
    country: 'India',
    users: 6980,
    active: 2010,
    neu: 280,
    growth: 9.4,
    region: 'East',
    cities: [
      { name: 'Kolkata', users: 4120, active: 1280, neu: 160, growth: 8.2 },
      { name: 'Howrah', users: 1640, active: 430, neu: 70, growth: 10.8 },
      { name: 'Siliguri', users: 1220, active: 300, neu: 50, growth: 12.4 },
    ],
  },
  {
    name: 'Kerala',
    country: 'India',
    users: 5810,
    active: 1980,
    neu: 240,
    growth: 8.7,
    region: 'South',
    cities: [
      { name: 'Kochi', users: 2480, active: 920, neu: 110, growth: 9.6 },
      { name: 'Thiruvananthapuram', users: 1860, active: 610, neu: 70, growth: 7.4 },
      { name: 'Kozhikode', users: 1470, active: 450, neu: 60, growth: 8.8 },
    ],
  },
  {
    name: 'Haryana',
    country: 'India',
    users: 4920,
    active: 1760,
    neu: 260,
    growth: 20.4,
    region: 'North',
    cities: [
      { name: 'Gurugram', users: 3120, active: 1240, neu: 180, growth: 23.8 },
      { name: 'Faridabad', users: 1800, active: 520, neu: 80, growth: 14.2 },
    ],
  },
  {
    name: 'Punjab',
    country: 'India',
    users: 4380,
    active: 1280,
    neu: 170,
    growth: 7.9,
    region: 'North',
    cities: [
      { name: 'Chandigarh', users: 1860, active: 620, neu: 80, growth: 9.1 },
      { name: 'Ludhiana', users: 1420, active: 380, neu: 50, growth: 6.4 },
      { name: 'Amritsar', users: 1100, active: 280, neu: 40, growth: 7.8 },
    ],
  },
  {
    name: 'Madhya Pradesh',
    country: 'India',
    users: 4120,
    active: 1080,
    neu: 190,
    growth: 11.2,
    region: 'Central',
    cities: [
      { name: 'Indore', users: 2280, active: 640, neu: 110, growth: 13.6 },
      { name: 'Bhopal', users: 1840, active: 440, neu: 80, growth: 8.4 },
    ],
  },
  {
    name: 'Andhra Pradesh',
    country: 'India',
    users: 3860,
    active: 1020,
    neu: 160,
    growth: 10.1,
    region: 'South',
    cities: [
      { name: 'Visakhapatnam', users: 2140, active: 580, neu: 90, growth: 11.8 },
      { name: 'Vijayawada', users: 1720, active: 440, neu: 70, growth: 8.2 },
    ],
  },
  {
    name: 'Bihar',
    country: 'India',
    users: 2740,
    active: 620,
    neu: 150,
    growth: 16.8,
    region: 'East',
    cities: [
      { name: 'Patna', users: 1680, active: 410, neu: 90, growth: 18.2 },
      { name: 'Gaya', users: 1060, active: 210, neu: 60, growth: 14.4 },
    ],
  },
  {
    name: 'Odisha',
    country: 'India',
    users: 1980,
    active: 480,
    neu: 70,
    growth: 6.2,
    region: 'East',
    cities: [
      { name: 'Bhubaneswar', users: 1240, active: 320, neu: 45, growth: 7.1 },
      { name: 'Cuttack', users: 740, active: 160, neu: 25, growth: 4.8 },
    ],
  },
  {
    name: 'Assam',
    country: 'India',
    users: 1640,
    active: 390,
    neu: 80,
    growth: 17.6,
    region: 'Northeast',
    cities: [{ name: 'Guwahati', users: 1640, active: 390, neu: 80, growth: 17.6 }],
  },
  {
    name: 'Jharkhand',
    country: 'India',
    users: 1280,
    active: 260,
    neu: 40,
    growth: 5.1,
    region: 'East',
    cities: [{ name: 'Ranchi', users: 1280, active: 260, neu: 40, growth: 5.1 }],
  },
  {
    name: 'Chhattisgarh',
    country: 'India',
    users: 980,
    active: 190,
    neu: 30,
    growth: 4.4,
    region: 'Central',
    cities: [{ name: 'Raipur', users: 980, active: 190, neu: 30, growth: 4.4 }],
  },
  {
    name: 'Goa',
    country: 'India',
    users: 860,
    active: 310,
    neu: 40,
    growth: 12.2,
    region: 'West',
    cities: [{ name: 'Panaji', users: 860, active: 310, neu: 40, growth: 12.2 }],
  },
  {
    name: 'Uttarakhand',
    country: 'India',
    users: 720,
    active: 180,
    neu: 25,
    growth: 8.1,
    region: 'North',
    cities: [{ name: 'Dehradun', users: 720, active: 180, neu: 25, growth: 8.1 }],
  },
  {
    name: 'Himachal Pradesh',
    country: 'India',
    users: 410,
    active: 90,
    neu: 12,
    growth: 3.8,
    region: 'North',
    cities: [{ name: 'Shimla', users: 410, active: 90, neu: 12, growth: 3.8 }],
  },
  {
    name: 'Jammu and Kashmir',
    country: 'India',
    users: 540,
    active: 110,
    neu: 18,
    growth: 6.6,
    region: 'North',
    cities: [{ name: 'Srinagar', users: 540, active: 110, neu: 18, growth: 6.6 }],
  },
  {
    name: 'Ladakh',
    country: 'India',
    users: 180,
    active: 40,
    neu: 8,
    growth: 9.4,
    region: 'North',
    cities: [{ name: 'Leh', users: 180, active: 40, neu: 8, growth: 9.4 }],
  },
  {
    name: 'Chandigarh',
    country: 'India',
    users: 640,
    active: 210,
    neu: 22,
    growth: 8.8,
    region: 'North',
    cities: [{ name: 'Chandigarh City', users: 640, active: 210, neu: 22, growth: 8.8 }],
  },
  {
    name: 'Arunachal Pradesh',
    country: 'India',
    users: 210,
    active: 48,
    neu: 12,
    growth: 11.2,
    region: 'Northeast',
    cities: [{ name: 'Itanagar', users: 210, active: 48, neu: 12, growth: 11.2 }],
  },
  {
    name: 'Nagaland',
    country: 'India',
    users: 190,
    active: 42,
    neu: 9,
    growth: 7.6,
    region: 'Northeast',
    cities: [{ name: 'Kohima', users: 190, active: 42, neu: 9, growth: 7.6 }],
  },
  {
    name: 'Manipur',
    country: 'India',
    users: 260,
    active: 70,
    neu: 14,
    growth: 10.4,
    region: 'Northeast',
    cities: [{ name: 'Imphal', users: 260, active: 70, neu: 14, growth: 10.4 }],
  },
  {
    name: 'Mizoram',
    country: 'India',
    users: 150,
    active: 36,
    neu: 7,
    growth: 6.8,
    region: 'Northeast',
    cities: [{ name: 'Aizawl', users: 150, active: 36, neu: 7, growth: 6.8 }],
  },
  {
    name: 'Tripura',
    country: 'India',
    users: 280,
    active: 64,
    neu: 16,
    growth: 12.1,
    region: 'Northeast',
    cities: [{ name: 'Agartala', users: 280, active: 64, neu: 16, growth: 12.1 }],
  },
  {
    name: 'Meghalaya',
    country: 'India',
    users: 240,
    active: 58,
    neu: 11,
    growth: 8.3,
    region: 'Northeast',
    cities: [{ name: 'Shillong', users: 240, active: 58, neu: 11, growth: 8.3 }],
  },
  {
    name: 'Sikkim',
    country: 'India',
    users: 120,
    active: 32,
    neu: 6,
    growth: 14.8,
    region: 'Northeast',
    cities: [{ name: 'Gangtok', users: 120, active: 32, neu: 6, growth: 14.8 }],
  },
  {
    name: 'Puducherry',
    country: 'India',
    users: 310,
    active: 96,
    neu: 14,
    growth: 9.7,
    region: 'South',
    cities: [{ name: 'Puducherry City', users: 310, active: 96, neu: 14, growth: 9.7 }],
  },
  {
    name: 'Andaman and Nicobar',
    country: 'India',
    users: 90,
    active: 22,
    neu: 4,
    growth: 5.2,
    region: 'Islands',
    cities: [{ name: 'Port Blair', users: 90, active: 22, neu: 4, growth: 5.2 }],
  },
  {
    name: 'Lakshadweep',
    country: 'India',
    users: 40,
    active: 10,
    neu: 2,
    growth: 3.1,
    region: 'Islands',
    cities: [{ name: 'Kavaratti', users: 40, active: 10, neu: 2, growth: 3.1 }],
  },
  {
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    country: 'India',
    users: 110,
    active: 28,
    neu: 5,
    growth: 6.4,
    region: 'West',
    cities: [{ name: 'Silvassa', users: 110, active: 28, neu: 5, growth: 6.4 }],
  },
]

export const GEO_OVERSEAS = [
  { country: 'UAE', state: 'Dubai', city: 'Dubai', users: 640, active: 220, neu: 28, growth: 14.6 },
  { country: 'Singapore', state: 'Singapore', city: 'Singapore', users: 380, active: 140, neu: 16, growth: 9.2 },
  { country: 'United Kingdom', state: 'England', city: 'London', users: 290, active: 90, neu: 10, growth: 5.4 },
]

const round = (value) => Math.max(0, Math.round(value))

const customScale = (start, end) => {
  if (!start || !end) return 1
  const days = Math.max(1, (new Date(end) - new Date(start)) / 86400000 + 1)
  return days / 30
}

export const scaleForRange = (preset, customStart, customEnd) => {
  if (preset === 'custom') return customScale(customStart, customEnd)
  return RANGE_SCALE[preset] ?? 1
}

const scaleRow = (row, scale) => ({
  ...row,
  users: round(row.users * scale),
  active: round(row.active * scale),
  neu: round(row.neu * scale),
})

export const buildGeoView = ({
  preset = '30d',
  customStart = '',
  customEnd = '',
  country = 'all',
  state = 'all',
  city = 'all',
} = {}) => {
  const scale = scaleForRange(preset, customStart, customEnd)
  const scaledStates = GEO_STATES.map((item) => ({
    ...scaleRow(item, scale),
    cities: item.cities.map((entry) => scaleRow(entry, scale)),
  }))

  const indiaStates = scaledStates.filter((item) => {
    if (country !== 'all' && country !== 'India') return false
    if (state !== 'all' && item.name !== state) return false
    return true
  })

  const overseas = GEO_OVERSEAS.map((item) => scaleRow(item, scale)).filter((item) => {
    if (country !== 'all' && item.country !== country) return false
    if (state !== 'all' && item.state !== state) return false
    if (city !== 'all' && item.city !== city) return false
    return true
  })

  const cityRows = [
    ...indiaStates.flatMap((item) =>
      item.cities
        .filter((entry) => city === 'all' || entry.name === city)
        .map((entry) => ({
          country: 'India',
          state: item.name,
          city: entry.name,
          region: item.region,
          ...entry,
        }))
    ),
    ...overseas.map((item) => ({ ...item, region: 'Overseas' })),
  ].sort((a, b) => b.users - a.users)

  const regionMap = {}
  indiaStates.forEach((item) => {
    if (!regionMap[item.region]) regionMap[item.region] = { label: item.region, users: 0, active: 0, neu: 0 }
    regionMap[item.region].users += item.users
    regionMap[item.region].active += item.active
    regionMap[item.region].neu += item.neu
  })
  const regions = Object.values(regionMap).sort((a, b) => b.users - a.users)

  const totalUsers = cityRows.reduce((sum, row) => sum + row.users, 0)
  const activeUsers = cityRows.reduce((sum, row) => sum + row.active, 0)
  const newUsers = cityRows.reduce((sum, row) => sum + row.neu, 0)
  const topCity = cityRows[0] || { city: '—', users: 0, growth: 0 }
  const topState = [...indiaStates].sort((a, b) => b.users - a.users)[0] || { name: '—', users: 0 }
  const fastestRegion = [...regions].sort((a, b) => b.neu / Math.max(b.users, 1) - a.neu / Math.max(a.users, 1))[0] || {
    label: '—',
  }
  const fastestCities = [...cityRows].sort((a, b) => b.growth - a.growth)
  const lowActivity = [...cityRows].sort((a, b) => a.active / Math.max(a.users, 1) - b.active / Math.max(b.users, 1))

  const daily = dayLabels.map((name, index) => {
    const wave = 0.7 + ((index % 5) * 0.08)
    return {
      name,
      mumbai: round((topCity.neu / 14) * wave * 1.4),
      bengaluru: round((newUsers / 14) * wave * 0.22),
      hyderabad: round((newUsers / 14) * wave * 0.16),
      delhi: round((newUsers / 14) * wave * 0.18),
    }
  })

  const monthly = monthLabels.map((name, index) => {
    const lift = 0.75 + index * 0.08
    return {
      name,
      west: round((regionMap.West?.neu || 80) * lift),
      south: round((regionMap.South?.neu || 80) * lift),
      north: round((regionMap.North?.neu || 80) * lift),
      east: round((regionMap.East?.neu || 40) * lift),
    }
  })

  const selectedState =
    state !== 'all' ? scaledStates.find((item) => item.name === state) || null : null

  return {
    scale,
    states: indiaStates,
    allIndiaStates: scaledStates,
    cities: cityRows,
    regions,
    overseas,
    kpis: {
      totalUsers,
      activeUsers,
      newUsers,
      topCity: topCity.city,
      topCityUsers: topCity.users,
      topState: topState.name,
      topStateUsers: topState.users,
      fastestRegion: fastestRegion.label,
    },
    topStates: [...indiaStates].sort((a, b) => b.users - a.users).slice(0, 10),
    topCities: cityRows.slice(0, 20),
    fastestCities: fastestCities.slice(0, 8),
    lowActivity: lowActivity.slice(0, 6),
    daily,
    monthly,
    selectedState,
    table: cityRows.map((row, index) => ({
      rank: index + 1,
      country: row.country,
      state: row.state,
      city: row.city,
      users: row.users,
      active: row.active,
      neu: row.neu,
      growth: row.growth,
    })),
    insights: {
      top: cityRows.slice(0, 4),
      fastest: fastestCities.slice(0, 4),
      low: lowActivity.slice(0, 4),
      registrations: [...cityRows].sort((a, b) => b.neu - a.neu).slice(0, 4),
      emerging: fastestCities.filter((row) => row.users < 2500).slice(0, 4),
    },
  }
}

export const uniqueStates = () => GEO_STATES.map((item) => item.name)
export const uniqueCities = (stateName = 'all') => {
  const source = stateName === 'all' ? GEO_STATES : GEO_STATES.filter((item) => item.name === stateName)
  return source.flatMap((item) => item.cities.map((city) => city.name))
}
