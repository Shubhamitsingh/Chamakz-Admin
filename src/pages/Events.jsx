import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Megaphone, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react'
import Modal from '../components/Modal'
import SearchBar from '../components/SearchBar'
import Toast from '../components/Toast'
import Loader from '../components/Loader'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'

const Events = () => {
  const [activeTab, setActiveTab] = useState('announcements')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedItem, setSelectedItem] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const [announcements, setAnnouncements] = useState([])
  const [events, setEvents] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startDate: '',
    endDate: '',
    priority: 'medium',
    banner: '',
  })

  // Fetch announcements with real-time updates
  useEffect(() => {
    console.log('📢 Loading announcements from Firebase...')
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'announcements'),
        (snapshot) => {
          const announcementsData = snapshot.docs.map(doc => {
            const data = doc.data()
            
            // Safely convert timestamp to string
            let createdAtStr = 'N/A'
            try {
              if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                createdAtStr = new Date(data.createdAt.toDate()).toLocaleDateString()
              }
            } catch (err) {
              console.log('Error converting timestamp:', err)
            }
            
            return {
              id: doc.id,
              title: data.title || 'No Title',
              description: data.description || '',
              date: data.date || '',
              priority: data.priority || 'medium',
              status: data.status || 'active',
              createdAt: createdAtStr
            }
          })
          console.log(`✅ Loaded ${announcementsData.length} announcements`)
          setAnnouncements(announcementsData)
          setLoading(false)
          setError(null)
        },
        (error) => {
          console.error('❌ Error fetching announcements:', error)
          setAnnouncements([])
          setLoading(false)
          setError(error.message)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.error('❌ Fatal error in Events page:', err)
      setError(err.message)
      setLoading(false)
    }
  }, [])

  // Fetch events with real-time updates
  useEffect(() => {
    console.log('📅 Loading events from Firebase...')
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'events'),
        (snapshot) => {
          const eventsData = snapshot.docs.map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              title: data.title || 'No Title',
              description: data.description || '',
              startDate: data.startDate || '',
              endDate: data.endDate || '',
              banner: data.banner || '',
              status: data.status || 'scheduled',
              participants: data.participants || 0
            }
          })
          console.log(`✅ Loaded ${eventsData.length} events`)
          setEvents(eventsData)
        },
        (error) => {
          console.error('❌ Error fetching events:', error)
          setEvents([])
          setError(error.message)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.error('❌ Fatal error loading events:', err)
      setError(err.message)
      setEvents([])
    }
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5MB', 'error')
        return
      }
      
      setSelectedImage(file)
      setFormData({ ...formData, banner: '' }) // Clear URL if file is selected
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddNew = () => {
    setModalMode('add')
    setSelectedItem(null)
    setSelectedImage(null)
    setImagePreview(null)
    setFormData({
      title: '',
      description: '',
      date: '',
      startDate: '',
      endDate: '',
      priority: 'medium',
      banner: '',
    })
    setShowModal(true)
  }

  const handleEdit = (item) => {
    setModalMode('edit')
    setSelectedItem(item)
    setSelectedImage(null)
    setImagePreview(item.banner || null)
    if (activeTab === 'announcements') {
      setFormData({
        title: item.title,
        description: item.description,
        date: item.date,
        priority: item.priority,
      })
    } else {
      setFormData({
        title: item.title,
        description: item.description,
        startDate: item.startDate,
        endDate: item.endDate,
        banner: item.banner,
      })
    }
    setShowModal(true)
  }

  const handleDelete = (id) => {
    setItemToDelete(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    setProcessing(true)
    setShowDeleteConfirm(false)
    try {
      const collectionName = activeTab === 'announcements' ? 'announcements' : 'events'
      await deleteDoc(doc(db, collectionName, itemToDelete))
      setToast({ show: true, message: `${activeTab === 'announcements' ? 'Announcement' : 'Event'} deleted successfully`, type: 'success' })
      setItemToDelete(null)
    } catch (error) {
      setToast({ show: true, message: 'Error deleting item', type: 'error' })
    }
    setProcessing(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setProcessing(true)
    setUploading(false)

    try {
      // Determine banner URL: use uploaded file OR use URL from input
      let bannerUrl = ''
      
      if (selectedImage && activeTab === 'events') {
        // Option 1: Upload image file to Firebase Storage
        try {
          setUploading(true)
          showToast('Uploading image...', 'success')
          
          // Create unique filename
          const timestamp = Date.now()
          const filename = `events/${timestamp}_${selectedImage.name}`
          const storageRef = ref(storage, filename)
          
          // Upload file
          await uploadBytes(storageRef, selectedImage)
          
          // Get download URL
          bannerUrl = await getDownloadURL(storageRef)
          console.log('✅ Image uploaded:', bannerUrl)
          showToast('Image uploaded successfully!', 'success')
          setUploading(false)
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
          showToast('Error uploading image: ' + uploadError.message, 'error')
          setProcessing(false)
          setUploading(false)
          return
        }
      } else if (formData.banner && activeTab === 'events') {
        // Option 2: Use URL from text input
        bannerUrl = formData.banner
        console.log('✅ Using image URL:', bannerUrl)
      }
      
      if (activeTab === 'announcements') {
        const announcementData = {
          title: formData.title,
          description: formData.description,
          message: formData.description, // For Flutter app compatibility
          date: formData.date,
          displayDate: formData.date, // For Flutter app
          priority: formData.priority,
          status: 'active',
          isActive: true, // For Flutter app
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          timestamp: serverTimestamp() // Alternative timestamp field
        }

        if (modalMode === 'add') {
          const docRef = await addDoc(collection(db, 'announcements'), announcementData)
          console.log('✅ Announcement created with ID:', docRef.id)
          showToast('Announcement created successfully! It will appear in your app.', 'success')
        } else {
          await updateDoc(doc(db, 'announcements', selectedItem.id), {
            title: formData.title,
            description: formData.description,
            message: formData.description,
            date: formData.date,
            displayDate: formData.date,
            priority: formData.priority,
            updatedAt: serverTimestamp()
          })
          showToast('Announcement updated successfully', 'success')
        }
      } else {
        const eventData = {
          title: formData.title,
          name: formData.title, // Alternative field for Flutter
          description: formData.description,
          details: formData.description, // Alternative field
          startDate: formData.startDate,
          endDate: formData.endDate,
          banner: bannerUrl, // Use uploaded URL
          bannerUrl: bannerUrl, // Alternative field
          imageUrl: bannerUrl, // Alternative field
          image: bannerUrl, // Alternative field
          status: 'scheduled',
          isActive: true,
          participants: 0,
          participantCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          timestamp: serverTimestamp()
        }

        if (modalMode === 'add') {
          const docRef = await addDoc(collection(db, 'events'), eventData)
          console.log('✅ Event created with ID:', docRef.id)
          showToast('Event created successfully! It will appear in your app.', 'success')
        } else {
          await updateDoc(doc(db, 'events', selectedItem.id), {
            title: formData.title,
            name: formData.title,
            description: formData.description,
            details: formData.description,
            startDate: formData.startDate,
            endDate: formData.endDate,
            banner: bannerUrl,
            bannerUrl: bannerUrl,
            imageUrl: bannerUrl,
            image: bannerUrl,
            updatedAt: serverTimestamp()
          })
          showToast('Event updated successfully', 'success')
        }
      }

      setShowModal(false)
      setSelectedImage(null)
      setImagePreview(null)
      setFormData({
        title: '',
        description: '',
        date: '',
        startDate: '',
        endDate: '',
        priority: 'medium',
        banner: '',
      })
    } catch (error) {
      console.error('Error saving:', error)
      showToast('Error saving item: ' + error.message, 'error')
    }
    setProcessing(false)
  }

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'ended':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Events</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Events Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage announcements and events for your app users
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="btn-primary flex items-center gap-2"
          disabled={processing}
        >
          <Plus className="w-5 h-5" />
          Add {activeTab === 'announcements' ? 'Announcement' : 'Event'}
        </button>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'announcements'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Megaphone className="w-5 h-5" />
            Announcements
            {activeTab === 'announcements' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'events'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Events
            {activeTab === 'events' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
              />
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="pt-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={`Search ${activeTab}...`}
          />
        </div>
      </motion.div>

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 gap-4">
          {filteredAnnouncements.map((announcement, index) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{announcement.title}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                        announcement.priority
                      )}`}
                    >
                      {announcement.priority.toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        announcement.status
                      )}`}
                    >
                      {announcement.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {announcement.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>📅 Display Date: {announcement.date}</span>
                    <span>🕒 Created: {announcement.createdAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Edit"
                    disabled={processing}
                  >
                    <Edit2 className="w-5 h-5 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Delete"
                    disabled={processing}
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredAnnouncements.length === 0 && (
            <div className="card text-center py-12">
              <Megaphone className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No announcements found</p>
              <button onClick={handleAddNew} className="btn-primary mt-4">
                Create First Announcement
              </button>
            </div>
          )}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="card hover:shadow-lg transition-shadow"
            >
              {/* Event Banner */}
              <div className="relative h-40 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                {event.banner ? (
                  <img 
                    src={event.banner} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.innerHTML += '<div class="flex items-center justify-center w-full h-full"><svg class="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>'
                    }}
                  />
                ) : (
                  <Calendar className="w-16 h-16 text-white opacity-50" />
                )}
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      event.status
                    )} backdrop-blur-sm`}
                  >
                    {event.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Event Details */}
              <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {event.description}
              </p>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <span>📅 Start:</span>
                  <span className="font-medium">{event.startDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📅 End:</span>
                  <span className="font-medium">{event.endDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>👥 Participants:</span>
                  <span className="font-medium">{event.participants.toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleEdit(event)}
                  className="flex-1 btn-secondary text-sm flex items-center justify-center gap-1"
                  disabled={processing}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="flex-1 btn-danger text-sm flex items-center justify-center gap-1"
                  disabled={processing}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
          {filteredEvents.length === 0 && (
            <div className="col-span-full card text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No events found</p>
              <button onClick={handleAddNew} className="btn-primary mt-4">
                Create First Event
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${modalMode === 'add' ? 'Add' : 'Edit'} ${
          activeTab === 'announcements' ? 'Announcement' : 'Event'
        }`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              required
              disabled={processing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={4}
              required
              disabled={processing}
            />
          </div>

          {activeTab === 'announcements' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Display Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-field"
                  required
                  disabled={processing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="input-field"
                  required
                  disabled={processing}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field"
                    required
                    disabled={processing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input-field"
                    required
                    disabled={processing}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Event Banner</label>
                
                {/* Option 1: Upload from Computer */}
                <div className="mb-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Option 1: Upload from Computer</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="input-field"
                    disabled={processing || uploading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Max 5MB. Supported: JPG, PNG, GIF, WebP
                  </p>
                </div>

                {/* OR Divider */}
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                  <span className="text-xs text-gray-500 font-medium">OR</span>
                  <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                </div>

                {/* Option 2: Paste Image URL */}
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Option 2: Paste Image URL</p>
                  <input
                    type="url"
                    value={formData.banner}
                    onChange={(e) => {
                      setFormData({ ...formData, banner: e.target.value })
                      setImagePreview(e.target.value)
                      setSelectedImage(null) // Clear file if URL is entered
                    }}
                    placeholder="https://example.com/image.jpg"
                    className="input-field"
                    disabled={processing || uploading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste URL of an image hosted online
                  </p>
                </div>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-40 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                      onError={(e) => {
                        e.target.src = ''
                        e.target.alt = 'Invalid image URL'
                        e.target.className = 'w-full h-40 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-red-300 text-red-500'
                      }}
                    />
                  </div>
                )}
                
                {uploading && (
                  <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
                    ⏳ Uploading image to Firebase Storage...
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => setShowModal(false)} 
              className="btn-secondary flex-1"
              disabled={processing}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary flex-1"
              disabled={processing || uploading}
            >
              {uploading ? 'Uploading Image...' : processing ? 'Saving...' : (modalMode === 'add' ? 'Create' : 'Update')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast Notification */}
      {toast.show && <Toast message={toast.message} type={toast.type} />}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setItemToDelete(null)
        }}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this {activeTab === 'announcements' ? 'announcement' : 'event'}? This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowDeleteConfirm(false)
                setItemToDelete(null)
              }}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50"
              disabled={processing}
            >
              {processing ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Events
