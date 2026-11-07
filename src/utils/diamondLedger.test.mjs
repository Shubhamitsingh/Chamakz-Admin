import assert from 'node:assert/strict'
import {
  adminRecharge,
  createLedgerStore,
  sellerTransfer,
  setSellerStatus,
  setWalletFrozen,
} from './diamondLedger.js'

const users = {
  userB: { name: 'User B', numericUserId: '2000002', role: 'User', ucoin: 1000, verified: true },
  sellerA: { name: 'Seller A', numericUserId: '2000001', role: 'User', ucoin: 0, verified: true },
  adminAcc: { name: 'Ops Admin', numericUserId: '9000001', role: 'Admin', ucoin: 0 },
}

const store = createLedgerStore(users)

const recharge = adminRecharge(store, {
  userQuery: '2000002',
  amount: 10000,
  reason: 'Test recharge',
  actorId: 'admin',
  actorRole: 'superadmin',
  idempotencyKey: 't1',
})
assert.equal(store.users.userB.ucoin, 11000)
assert.equal(recharge.transaction.type, 'ADMIN_RECHARGE')

adminRecharge(store, {
  userQuery: '2000001',
  amount: 100000,
  reason: 'Seller stock',
  actorId: 'admin',
  actorRole: 'superadmin',
  idempotencyKey: 't2',
})
setSellerStatus(store, { userQuery: '2000001', status: 'approved', actorId: 'admin' })
assert.equal(store.users.sellerA.ucoin, 100000)

const transfer = sellerTransfer(store, {
  sellerQuery: '2000001',
  recipientQuery: '2000002',
  amount: 5000,
  idempotencyKey: 't3',
})
assert.equal(store.users.sellerA.ucoin, 95000)
assert.equal(store.users.userB.ucoin, 16000)
assert.equal(transfer.transaction.newSenderBalance, 95000)

assert.throws(() => sellerTransfer(store, {
  sellerQuery: '2000001',
  recipientQuery: '2000002',
  amount: 96000,
  idempotencyKey: 't4',
}), /enough diamonds/)
assert.equal(store.users.sellerA.ucoin, 95000)
assert.equal(store.users.userB.ucoin, 16000)

const again = sellerTransfer(store, {
  sellerQuery: '2000001',
  recipientQuery: '2000002',
  amount: 5000,
  idempotencyKey: 't3',
})
assert.equal(again.replayed, true)
assert.equal(store.users.sellerA.ucoin, 95000)

assert.throws(() => sellerTransfer(store, {
  sellerQuery: '2000001',
  recipientQuery: '2000002',
  amount: 1000,
  idempotencyKey: 't6',
  failAfterDebit: true,
}), /failed after the debit/)
assert.equal(store.users.sellerA.ucoin, 95000)
assert.equal(store.users.userB.ucoin, 16000)
assert.equal(store.diamond_transactions.t6, undefined)

setWalletFrozen(store, { userQuery: '2000001', frozen: true, actorId: 'admin' })
assert.throws(() => sellerTransfer(store, {
  sellerQuery: '2000001',
  recipientQuery: '2000002',
  amount: 100,
  idempotencyKey: 't7',
}), /frozen/)
assert.equal(store.users.sellerA.ucoin, 95000)

assert.throws(() => adminRecharge(store, {
  userQuery: '9000001',
  amount: 10,
  reason: 'Nope',
  actorId: 'staff',
  actorRole: 'admin',
  idempotencyKey: 't8',
}), /Super Admin/)

const history = Object.values(store.diamond_transactions)
assert.equal(history.filter((row) => row.status === 'completed').length, 3)
console.log('diamond ledger tests passed', history.map((row) => row.id).join(', '))
