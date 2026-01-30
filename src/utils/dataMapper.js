/**
 * Centralized Data Mapping Utilities
 * Provides consistent data mapping patterns across the application
 */

import { formatDate, formatDateTime, getDateFromTimestamp } from './dateFormatter'

/**
 * Map user data from Firestore document
 */
export const mapUserData = (docSnapshot, userData = null) => {
  if (!docSnapshot && !userData) return null
  
  const data = userData || docSnapshot.data()
  if (!data) return null
  
  // Parse dates
  const joinDate = formatDate(data.createdAt || data.created_at || data.timestamp)
  const lastActive = formatDate(data.lastActive || data.last_active)
  
  // Determine role
  const userRole = data.role || (data.liveApprovalCode ? 'Host' : 'User')
  
  // Determine live streaming approval status
  const isActive = data.isActive === true
  
  return {
    id: docSnapshot?.id || data.id || '',
    numericUserId: data.numericUserId || data.numeric_user_id || 'N/A',
    name: data.name || data.displayName || data.userName || 'Unknown User',
    email: data.email || 'No email',
    role: userRole,
    status: data.blocked ? 'Blocked' : 'Active',
    coins: Number(data.coins) || 0,
    joinDate,
    lastActive,
    isActive,
    ...data
  }
}

/**
 * Map withdrawal request data
 */
export const mapWithdrawalData = (docSnapshot) => {
  if (!docSnapshot.exists()) return null
  
  const data = docSnapshot.data()
  if (!data) return null
  
  const createdAt = data.createdAt || data.created_at || data.timestamp || data.requestDate
  const createdAtDate = getDateFromTimestamp(createdAt)
  
  return {
    id: docSnapshot.id,
    hostName: data.hostName || data.userName || data.name || data.host_name || 'Unknown Host',
    hostId: data.hostId || data.userId || data.user_id || '',
    numericUserId: data.numericUserId || data.numeric_user_id || data.userId || data.user_id || 'N/A',
    coins: data.coins || data.coinsAmount || data.coins_amount || data.amount || 0,
    amount: data.amount || data.withdrawalAmount || data.withdrawal_amount || data.requestedAmount || 0,
    accountNumber: data.accountNumber || data.bankAccount || data.bank_account || data.account_number || 'N/A',
    bankName: data.bankName || data.bank_name || 'N/A',
    accountHolder: data.accountHolder || data.accountHolderName || data.account_holder || data.account_holder_name || data.hostName || data.userName || 'N/A',
    ifscCode: data.ifscCode || data.ifsc || data.ifsc_code || 'N/A',
    upiId: data.upiId || data.upi || data.upi_id || 'N/A',
    paymentMethod: data.paymentMethod || data.payment_method || data.method || 'Bank Transfer',
    status: (data.status || 'pending').toLowerCase().trim(),
    requestDate: createdAtDate ? formatDate(createdAtDate) : 'N/A',
    requestDateTime: createdAtDate ? formatDateTime(createdAtDate) : 'N/A',
    createdAt: createdAtDate,
    paymentProof: data.paymentProof || data.payment_proof || data.screenshot || null,
    rejectionReason: data.rejectionReason || data.rejection_reason || null,
    ...data
  }
}

/**
 * Map host application data
 */
export const mapHostApplicationData = (docSnapshot, userData = null) => {
  if (!docSnapshot && !userData) return null
  
  const data = userData || docSnapshot.data()
  if (!data) return null
  
  const applicationDate = formatDateTime(data.createdAt || data.created_at || data.timestamp)
  const reviewedDate = formatDateTime(data.reviewedDate || data.reviewed_date || data.updatedAt)
  
  // Get user details
  let userName = data.userName || data.name || data.displayName || 'Unknown User'
  let userEmail = data.userEmail || data.email || 'No email'
  let userPhone = data.userPhone || data.phone || 'N/A'
  let numericUserId = data.numericUserId || data.userNumericId || 'N/A'
  
  const status = data.status || data.applicationStatus || 'pending'
  const statusLower = String(status).toLowerCase()
  
  return {
    id: docSnapshot?.id || data.id || '',
    userId: data.userId || data.user_id || data.uid || data.userID || '',
    numericUserId,
    userName,
    userEmail,
    userPhone,
    status: statusLower === 'pending' ? 'Pending' : statusLower === 'approved' ? 'Approved' : statusLower === 'rejected' ? 'Rejected' : 'Pending',
    applicationDate,
    reviewedDate: reviewedDate !== 'N/A' ? reviewedDate : 'N/A',
    reviewedBy: data.reviewedBy || data.reviewed_by || 'N/A',
    reason: data.reason || data.applicationReason || data.message || data.application_reason || 'No reason provided',
    experience: data.experience || data.experienceDescription || data.experience_description || 'N/A',
    bio: data.bio || data.description || 'N/A',
    documents: data.documents || data.document || {},
    category: data.category || 'N/A',
    createdAt: data.createdAt || data.created_at || data.timestamp,
    updatedAt: data.updatedAt || data.updated_at,
    reviewedAt: data.reviewedDate || data.reviewed_date,
    rawData: data
  }
}

/**
 * Map ticket data
 */
export const mapTicketData = (docSnapshot) => {
  if (!docSnapshot.exists()) return null
  
  const data = docSnapshot.data()
  if (!data) return null
  
  const createdAt = getDateFromTimestamp(data.createdAt || data.created_at || data.timestamp)
  
  return {
    id: docSnapshot.id,
    ticketId: data.ticketId || data.ticket_id || docSnapshot.id.substring(0, 8).toUpperCase(),
    userId: data.userId || data.user_id || data.uid || '',
    numericUserId: data.numericUserId || data.numeric_user_id || 'N/A',
    subject: data.subject || data.title || 'No Subject',
    description: data.description || data.message || data.content || 'No description',
    status: (data.status || 'open').toLowerCase(),
    priority: (data.priority || 'medium').toLowerCase(),
    createdAt: createdAt ? formatDateTime(createdAt) : 'N/A',
    updatedAt: formatDateTime(data.updatedAt || data.updated_at),
    createdDate: createdAt,
    ...data
  }
}

/**
 * Map chat data
 */
export const mapChatData = (docSnapshot) => {
  if (!docSnapshot.exists()) return null
  
  const data = docSnapshot.data()
  if (!data) return null
  
  const lastMessageTime = getDateFromTimestamp(data.lastMessageTime || data.last_message_time || data.updatedAt)
  
  return {
    id: docSnapshot.id,
    username: data.userName || data.username || data.name || 'Unknown User',
    userId: data.userId || data.uid || '',
    numericUserId: data.numericUserId || data.numeric_user_id || 'N/A',
    avatar: (data.userName || data.username || 'U').charAt(0).toUpperCase(),
    lastMessage: data.lastMessage || data.last_message || 'No messages yet',
    time: lastMessageTime ? formatTime(lastMessageTime) : 'N/A',
    unread: data.unreadByAdmin || data.unread_by_admin || 0,
    status: data.status || 'active',
    lastMessageTime,
    ...data
  }
}

/**
 * Map message data
 */
export const mapMessageData = (docSnapshot) => {
  if (!docSnapshot.exists()) return null
  
  const data = docSnapshot.data()
  if (!data) return null
  
  const timestamp = getDateFromTimestamp(data.timestamp || data.createdAt || data.created_at)
  
  return {
    id: docSnapshot.id,
    text: data.text || data.message || data.content || '',
    sender: data.senderType === 'admin' || data.isAdmin ? 'admin' : 'user',
    senderName: data.senderName || (data.senderType === 'admin' ? 'Admin' : 'User'),
    timestamp,
    time: timestamp ? formatTime(timestamp) : 'N/A',
    ...data
  }
}
