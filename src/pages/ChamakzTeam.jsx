import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Image as ImageIcon, X, Users, MessageSquare, Trash2, AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Loader from '../components/Loader'
import Modal from '../components/Modal'
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'

const ChamakzTeam = () => {
  const { showToast, user: adminUser } = useApp()
  const [message, setMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch all team messages
  useEffect(() => {
    console.log('📥 Setting up team_messages listener...')
    let unsubscribe = null
    
    try {
      unsubscribe = onSnapshot(
        query(collection(db, 'team_messages'), orderBy('createdAt', 'desc')),
        (snapshot) => {
          console.log('📥 Received', snapshot.size, 'messages from team_messages collection')
          const messagesData = snapshot.docs.map(doc => {
            const data = doc.data()
            // Only include image if it exists and is not empty
            const image = data.image || data.imageUrl || null
            return {
              id: doc.id,
              message: data.message || data.text || '',
              image: image && image.trim() !== '' ? image : null, // Only set if not empty
              sender: data.sender || 'Admin',
              senderId: data.senderId || 'admin',
              createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : (data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp)) : new Date()),
              ...data
            }
          })
          console.log('📥 Processed', messagesData.length, 'messages')
          setMessages(messagesData)
          setLoading(false)
        },
        (error) => {
          console.error('❌ Error fetching team messages:', error)
          console.error('❌ Error code:', error.code)
          console.error('❌ Error message:', error.message)
          
          if (error.code === 'permission-denied') {
            console.warn('⚠️ Firebase permission error: Please update Firestore security rules for "team_messages" collection')
            setMessages([])
            setLoading(false)
          } else if (error.code === 'failed-precondition') {
            // Index missing error - try without orderBy
            console.warn('⚠️ Index missing for createdAt, trying without orderBy...')
            unsubscribe = onSnapshot(
              collection(db, 'team_messages'),
              (snapshot) => {
                const messagesData = snapshot.docs.map(doc => {
                  const data = doc.data()
                  // Only include image if it exists and is not empty
                  const image = data.image || data.imageUrl || null
                  return {
                    id: doc.id,
                    message: data.message || data.text || '',
                    image: image && image.trim() !== '' ? image : null, // Only set if not empty
                    sender: data.sender || 'Admin',
                    senderId: data.senderId || 'admin',
                    createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : (data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp)) : new Date()),
                    ...data
                  }
                }).sort((a, b) => b.createdAt - a.createdAt)
                setMessages(messagesData)
                setLoading(false)
              },
              (fallbackError) => {
                console.error('❌ Fallback query also failed:', fallbackError)
                setMessages([])
                setLoading(false)
              }
            )
          } else {
            console.error('Error fetching team messages:', error)
            showToast('Error loading messages. Please check Firebase permissions.', 'error')
            setLoading(false)
          }
        }
      )
    } catch (error) {
      console.error('❌ Error setting up listener:', error)
      setMessages([])
      setLoading(false)
    }

    return () => {
      console.log('📥 Unsubscribing from team_messages listener')
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [showToast])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB', 'error')
        return
      }
      
      setSelectedImage(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handleDeleteMessage = (message) => {
    setMessageToDelete(message)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!messageToDelete) return

    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'team_messages', messageToDelete.id))
      showToast('Message deleted successfully', 'success')
      setShowDeleteConfirm(false)
      setMessageToDelete(null)
    } catch (error) {
      console.error('Error deleting message:', error)
      showToast(`Error deleting message: ${error.message}`, 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
    setMessageToDelete(null)
  }

  const handleSendMessage = async () => {
    if ((!message.trim() && !selectedImage) || sending) {
      showToast('Please enter a message or select an image', 'error')
      return
    }

    setSending(true)
    setUploading(true)

    try {
      let imageUrl = null

      // Upload image if provided
      if (selectedImage) {
        const timestamp = Date.now()
        const filename = `team_messages/${timestamp}_${selectedImage.name}`
        const storageRef = ref(storage, filename)
        
        await uploadBytes(storageRef, selectedImage)
        imageUrl = await getDownloadURL(storageRef)
      }

      // Build message data - only include image fields if image exists
      const messageData = {
        message: message.trim() || '',
        text: message.trim() || '',
        sender: 'Admin',
        senderId: adminUser?.uid || 'admin',
        senderName: 'Chamakz Team',
        type: 'team_message',
        sentTo: 'all_users',
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp()
      }

      // Only add image fields if image was uploaded
      if (imageUrl) {
        messageData.image = imageUrl
        messageData.imageUrl = imageUrl
      }

      // Save message to team_messages collection
      console.log('📤 Attempting to save message to team_messages collection...')
      console.log('📤 Admin user:', adminUser?.uid)
      console.log('📤 Message data:', {
        message: messageData.message,
        image: messageData.image || 'No image',
        senderId: messageData.senderId,
        senderName: messageData.senderName
      })
      
      const messageRef = await addDoc(collection(db, 'team_messages'), messageData)
      
      console.log('✅ Message saved successfully! Document ID:', messageRef.id)

      // Reset form
      setMessage('')
      setSelectedImage(null)
      setImagePreview(null)
      
      showToast('Message sent to all users successfully!', 'success')
    } catch (error) {
      console.error('❌ Error sending team message:', error)
      console.error('❌ Error code:', error.code)
      console.error('❌ Error message:', error.message)
      console.error('❌ Full error:', error)
      
      // Show detailed error message
      let errorMsg = `Error sending message: ${error.message}`
      if (error.code === 'permission-denied') {
        errorMsg = 'Permission denied! Please check Firebase security rules for "team_messages" collection.'
      } else if (error.code === 'unavailable') {
        errorMsg = 'Firebase service unavailable. Please check your internet connection.'
      }
      
      showToast(errorMsg, 'error')
    } finally {
      setSending(false)
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Chamakz Team</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Send messages to all users with text and images
          </p>
        </div>
      </motion.div>

      {/* Message Composition Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Send Message to All Users
        </h2>

        {/* Message Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here... (Optional if sending image)"
            rows={4}
            className="input-field w-full resize-none"
            disabled={sending || uploading}
          />
        </div>

        {/* Image Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Image (Optional)</label>
          <div className="flex gap-2 items-center">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={sending || uploading}
              />
              <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
                <ImageIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedImage ? selectedImage.name : 'Select image'}
                </span>
              </div>
            </label>
            
            {selectedImage && (
              <button
                onClick={removeImage}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                disabled={sending || uploading}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="mt-3 relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-w-md h-64 object-contain bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              />
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={(!message.trim() && !selectedImage) || sending || uploading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading...
            </>
          ) : sending ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Message to All Users
            </>
          )}
        </button>

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>ℹ️ Note:</strong> This message will be sent to all users and will appear in their app under "Chamakz Team" messages.
          </p>
        </div>
      </motion.div>

      {/* Previous Messages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Previous Messages ({messages.length})
        </h2>

        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No messages sent yet. Start by sending your first message above.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 relative group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-primary-600 dark:text-primary-400">
                      {msg.sender || msg.senderName || 'Admin'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'Recently'}
                    </p>
                  </div>
                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteMessage(msg)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {msg.image && (
                  <div className="mb-3">
                    <img
                      src={msg.image}
                      alt="Team message"
                      className="w-full max-w-md h-64 object-contain bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                      onClick={() => window.open(msg.image, '_blank')}
                    />
                  </div>
                )}

                {msg.message && (
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {msg.message}
                  </p>
                )}

                {!msg.message && !msg.image && (
                  <p className="text-gray-500 italic">No content</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        title="Delete Message"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300 mb-1">
                Are you sure you want to delete this message?
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">
                This action cannot be undone. The message will be permanently removed from all users' devices.
              </p>
            </div>
          </div>

          {messageToDelete && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Message Preview:</strong>
              </p>
              {messageToDelete.message && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                  {messageToDelete.message}
                </p>
              )}
              {messageToDelete.image && (
                <p className="text-xs text-gray-500 italic">
                  Contains image attachment
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleCancelDelete}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Delete Message
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ChamakzTeam
