/**
 * Centralized Firebase Collection Names
 * Use these constants instead of hardcoding collection names throughout the app
 */

import { collection, query, getDocs } from 'firebase/firestore'

export const COLLECTIONS = {
  // User Management
  USERS: 'users',
  HOST_APPLICATIONS: 'hosts_application', // Primary collection name
  HOST_APPLICATIONS_ALT: ['host_application', 'host_applications', 'hostApplications'], // Alternative names
  
  // Communication
  SUPPORT_CHATS: 'supportChats',
  SUPPORT_TICKETS: 'supportTickets',
  FEEDBACK: 'feedback',
  FEEDBACK_ALT: ['userFeedback', 'feedbacks', 'user_feedback', 'appFeedback', 'app_feedback', 'reviews', 'userReviews', 'suggestions', 'complaints'],
  TEAM_MESSAGES: 'team_messages',
  
  // Financial
  WITHDRAWAL_REQUESTS: 'withdrawal_requests',
  
  // Content
  BANNERS: 'banners',
  ANNOUNCEMENTS: 'announcements',
  EVENTS: 'events',
  
  // Settings
  SETTINGS: 'settings',
}

/**
 * Collection name finder utility
 * Tries primary name first, then alternatives
 */
export const findCollection = async (db, primaryName, alternativeNames = []) => {
  const allNames = [primaryName, ...alternativeNames]
  
  for (const name of allNames) {
    try {
      const testCollection = collection(db, name)
      const testQuery = query(testCollection)
      await getDocs(testQuery)
      return { name, collection: testCollection }
    } catch (err) {
      // Continue to next name
    }
  }
  
  // If none found, return primary anyway (might be empty)
  return { name: primaryName, collection: collection(db, primaryName) }
}
