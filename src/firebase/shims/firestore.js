import { seedCollections, timestamp } from '../../utils/mockData'

const store = seedCollections()
const listeners = new Map()

const clone = (value) => {
  if (!value || typeof value !== 'object') return value
  const copy = Array.isArray(value) ? [] : {}
  Object.entries(value).forEach(([key, nested]) => {
    if (nested && typeof nested.toDate === 'function') {
      copy[key] = timestamp(nested.toDate())
    } else if (nested && typeof nested === 'object') {
      copy[key] = clone(nested)
    } else {
      copy[key] = nested
    }
  })
  return copy
}

const notify = (path) => {
  const callbacks = listeners.get(path)
  if (!callbacks) return
  const snap = makeSnapshot(path)
  callbacks.forEach((callback) => callback(snap))
}

const makeDocSnap = (path, id, data) => ({
  id,
  exists: () => true,
  data: () => clone(data),
  ref: { id, path: `${path}/${id}` },
})

const listDocs = (path) => {
  const collectionData = store[path] || {}
  return Object.entries(collectionData).map(([id, data]) => makeDocSnap(path, id, data))
}

const applyQuery = (docs, constraints = []) => {
  let result = [...docs]
  for (const constraint of constraints) {
    if (!constraint) continue
    if (constraint.type === 'where') {
      result = result.filter((docSnap) => {
        const value = docSnap.data()[constraint.field]
        if (constraint.op === '==') return value === constraint.value
        return true
      })
    }
    if (constraint.type === 'orderBy') {
      const { field, direction } = constraint
      result.sort((a, b) => {
        const av = a.data()[field]
        const bv = b.data()[field]
        const aTime = av?.toDate ? av.toDate().getTime() : av
        const bTime = bv?.toDate ? bv.toDate().getTime() : bv
        if (aTime < bTime) return direction === 'desc' ? 1 : -1
        if (aTime > bTime) return direction === 'desc' ? -1 : 1
        return 0
      })
    }
    if (constraint.type === 'limit') {
      result = result.slice(0, constraint.value)
    }
  }
  return result
}

const makeSnapshot = (path, constraints) => {
  const docs = applyQuery(listDocs(path), constraints)
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs,
    forEach(fn) {
      docs.forEach(fn)
    },
    metadata: { hasPendingWrites: false, fromCache: true },
  }
}

const resolvePath = (ref) => {
  if (!ref) return ''
  if (ref.path) return ref.path
  if (ref.collection) return ref.collection
  return ''
}

export const getFirestore = () => ({ mock: true })

export const getStore = () => store

export const touchStore = (...paths) => {
  paths.forEach((path) => notify(path))
}

export const collection = (_db, ...segments) => ({
  type: 'collection',
  path: segments.join('/'),
})

export const collectionGroup = (_db, name) => ({
  type: 'collectionGroup',
  path: name,
  group: true,
})

export const doc = (dbOrCol, ...segments) => {
  if (dbOrCol?.type === 'collection') {
    return { type: 'doc', collection: dbOrCol.path, id: segments[0], path: `${dbOrCol.path}/${segments[0]}` }
  }
  const path = segments.slice(0, -1).join('/')
  const id = segments[segments.length - 1]
  return { type: 'doc', collection: path, id, path: `${path}/${id}` }
}

export const query = (ref, ...constraints) => ({
  ...ref,
  constraints: constraints.filter(Boolean),
})

export const where = (field, op, value) => ({ type: 'where', field, op, value })
export const orderBy = (field, direction = 'asc') => ({ type: 'orderBy', field, direction })
export const limit = (value) => ({ type: 'limit', value })
export const startAfter = () => ({ type: 'startAfter' })

const groupDocs = (name) => {
  const docs = []
  Object.keys(store).forEach((path) => {
    const leaf = path.split('/').pop()
    if (path === name || leaf === name) {
      docs.push(...listDocs(path))
    }
  })
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs,
    forEach(fn) {
      docs.forEach(fn)
    },
    metadata: { hasPendingWrites: false, fromCache: true },
  }
}

export const getDocs = async (ref) => {
  if (ref?.group) return groupDocs(ref.path)
  return makeSnapshot(resolvePath(ref), ref?.constraints)
}

export const getDoc = async (ref) => {
  const collectionPath = ref.collection || resolvePath(ref).split('/').slice(0, -1).join('/')
  const id = ref.id
  const data = store[collectionPath]?.[id]
  if (!data) {
    return { id: id || '', exists: () => false, data: () => undefined, ref }
  }
  return makeDocSnap(collectionPath, id, data)
}

export const onSnapshot = (ref, onNext, onError) => {
  const callback = typeof onNext === 'function' ? onNext : onNext?.next
  if (!callback) return () => {}
  const path = resolvePath(ref)
  const emit = () => {
    try {
      const snap = ref?.group ? groupDocs(path) : makeSnapshot(path, ref?.constraints)
      Promise.resolve(callback(snap)).catch((error) => {
        if (typeof onError === 'function') onError(error)
        else console.error(error)
      })
    } catch (error) {
      if (typeof onError === 'function') onError(error)
    }
  }
  if (!listeners.has(path)) listeners.set(path, new Set())
  listeners.get(path).add(callback)
  queueMicrotask(emit)
  return () => {
    listeners.get(path)?.delete(callback)
  }
}

export const addDoc = async (ref, data) => {
  const path = resolvePath(ref)
  if (!store[path]) store[path] = {}
  const id = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  store[path][id] = { ...data }
  notify(path)
  return { id, path: `${path}/${id}` }
}

export const setDoc = async (ref, data) => {
  const path = ref.collection
  const id = ref.id
  if (!store[path]) store[path] = {}
  store[path][id] = { ...data }
  notify(path)
}

export const updateDoc = async (ref, data) => {
  const path = ref.collection
  const id = ref.id
  if (!store[path]) store[path] = {}
  store[path][id] = { ...(store[path][id] || {}), ...data }
  notify(path)
}

export const deleteDoc = async (ref) => {
  const path = ref.collection
  const id = ref.id
  if (store[path]) delete store[path][id]
  notify(path)
}

export const serverTimestamp = () => timestamp(new Date())

export const Timestamp = {
  fromDate: (date) => timestamp(date),
  now: () => timestamp(new Date()),
}
