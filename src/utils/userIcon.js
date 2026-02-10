/**
 * Get a consistent icon number (1-21) for a user based on their ID
 * Cycles through icons 1-21 sequentially and loops back
 * This ensures the same user always gets the same icon
 */
export const getUserIcon = (userId) => {
  if (!userId) return 1
  
  // Simple approach: Convert user ID to a number and cycle through 1-21
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i)
    hash = hash + char
  }
  
  // Cycle through 1-21 (loops back after 21)
  const iconNumber = (Math.abs(hash) % 21) + 1
  return iconNumber
}

/**
 * Get the icon image path for a user
 * Handles both .png and .jpg formats (icon-1 is .jpg, others are .png)
 */
export const getUserIconPath = (userId) => {
  const iconNumber = getUserIcon(userId)
  // icon-1 is .jpg, all others are .png
  const extension = iconNumber === 1 ? 'jpg' : 'png'
  return `/icon-${iconNumber}.${extension}`
}
