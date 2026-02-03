import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Image as ImageIcon, X, Eye, Filter, Search, CheckCircle, XCircle, Image as BannerIcon } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import SearchBar from '../components/SearchBar'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'

const Banners = () => {
  const { showToast, user: adminUser } = useApp()
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' or 'edit'
  const [selectedBanner, setSelectedBanner] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [bannerToDelete, setBannerToDelete] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'active', 'inactive'
  const [sortBy, setSortBy] = useState('priority') // 'priority', 'date', 'views', 'clicks'
  
  // Form state - Simplified for profile screen only
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    imageUrl: '',
    isActive: true, // Always true by default
    priority: 5
  })
  
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch banners from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'banners'), orderBy('priority', 'desc')),
      (snapshot) => {
        const bannersData = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            image: data.image || data.imageUrl || data.banner || '',
            imageUrl: data.imageUrl || data.image || data.banner || '',
            priority: data.priority || 5,
            isActive: data.isActive !== undefined ? data.isActive : true,
            actionType: data.actionType || 'navigate',
            actionTarget: data.actionTarget || data.target || data.targetPage || 'profile_screen',
            targetPage: data.targetPage || data.actionTarget || data.target || 'profile_screen',
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            targetAudience: data.targetAudience || 'all',
            targetLevel: data.targetLevel || { min: 1, max: 100 },
            targetType: data.targetType || 'all',
            targetCountries: data.targetCountries || [],
            views: data.views || 0,
            clicks: data.clicks || 0,
            impressions: data.impressions || 0,
            createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date(),
            updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)) : new Date(),
            ...data
          }
        })
        setBanners(bannersData)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching banners:', error)
        if (error.code === 'permission-denied') {
          console.warn('⚠️ Firebase permission error: Please update Firestore security rules for "banners" collection')
          setBanners([])
        } else {
          showToast('Error loading banners', 'error')
        }
        setLoading(false)
      }
    )

    return () => unsubscribe()
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
      setFormData({ ...formData, image: '', imageUrl: '' }) // Clear URL if file selected
      
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
    setFormData({ ...formData, image: '', imageUrl: '' })
  }

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedBanner(null)
    setFormData({
      title: '',
      description: '',
      image: '',
      imageUrl: '',
      isActive: true, // Always true by default
      priority: 5
    })
    setSelectedImage(null)
    setImagePreview(null)
    setShowModal(true)
  }

  const openEditModal = (banner) => {
    setModalMode('edit')
    setSelectedBanner(banner)
    setFormData({
      title: banner.title || '',
      description: banner.description || '',
      image: banner.image || banner.imageUrl || '',
      imageUrl: banner.imageUrl || banner.image || '',
      priority: banner.priority || 5,
      isActive: banner.isActive !== undefined ? banner.isActive : true // Default to true if not set
    })
    setSelectedImage(null)
    setImagePreview(banner.image || banner.imageUrl || null)
    setShowModal(true)
  }

  const handleSaveBanner = async () => {
    if (!formData.imageUrl && !selectedImage) {
      showToast('Please upload an image or provide image URL', 'error')
      return
    }

    setSaving(true)
    setUploading(false)

    try {
      let imageUrl = formData.imageUrl || ''

      // Upload image if provided
      if (selectedImage) {
        setUploading(true)
        const timestamp = Date.now()
        const filename = `banners/${timestamp}_${selectedImage.name}`
        const storageRef = ref(storage, filename)
        
        await uploadBytes(storageRef, selectedImage)
        imageUrl = await getDownloadURL(storageRef)
        setUploading(false)
      }

      // Simplified banner data - only for profile screen
      // Simplified banner data - only for profile screen
      const bannerData = {
        title: formData.title || '',
        description: formData.description || '',
        image: imageUrl,
        imageUrl: imageUrl,
        banner: imageUrl,
        priority: Number(formData.priority) || 5,
        targetPage: 'profile_screen', // Always profile_screen
        actionTarget: 'profile_screen', // Always profile_screen
        target: 'profile_screen', // Always profile_screen
        updatedAt: serverTimestamp(),
        updatedBy: adminUser?.uid || 'admin'
      }
      
      if (modalMode === 'create') {
        // NEW banners: Always set isActive to true
        bannerData.isActive = true
        bannerData.createdAt = serverTimestamp()
        bannerData.views = 0
        bannerData.clicks = 0
        bannerData.impressions = 0
        console.log('✅ Creating NEW banner with isActive: true')
        await addDoc(collection(db, 'banners'), bannerData)
        showToast('Banner created successfully!', 'success')
      } else {
        // EDIT banners: Use form value, but default to true if not set
        bannerData.isActive = formData.isActive !== undefined ? formData.isActive : true
        console.log('✅ Updating banner with isActive:', bannerData.isActive)
        await updateDoc(doc(db, 'banners', selectedBanner.id), bannerData)
        showToast('Banner updated successfully!', 'success')
      }

      setShowModal(false)
      setSelectedImage(null)
      setImagePreview(null)
    } catch (error) {
      console.error('Error saving banner:', error)
      showToast(`Error saving banner: ${error.message}`, 'error')
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const handleDeleteBanner = async () => {
    if (!bannerToDelete) return

    try {
      await deleteDoc(doc(db, 'banners', bannerToDelete.id))
      showToast('Banner deleted successfully', 'success')
      setShowDeleteConfirm(false)
      setBannerToDelete(null)
    } catch (error) {
      console.error('Error deleting banner:', error)
      showToast(`Error deleting banner: ${error.message}`, 'error')
    }
  }

  const handleToggleActive = async (banner) => {
    try {
      await updateDoc(doc(db, 'banners', banner.id), {
        isActive: !banner.isActive,
        updatedAt: serverTimestamp()
      })
      showToast(`Banner ${!banner.isActive ? 'activated' : 'deactivated'}`, 'success')
    } catch (error) {
      console.error('Error toggling banner status:', error)
      showToast('Error updating banner status', 'error')
    }
  }

  // Filter and sort banners
  const filteredBanners = banners
    .filter(banner => {
      const matchesSearch = 
        (banner.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (banner.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = 
        filterStatus === 'all' ||
        (filterStatus === 'active' && banner.isActive) ||
        (filterStatus === 'inactive' && !banner.isActive)
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return b.priority - a.priority
        case 'date':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'views':
          return (b.views || 0) - (a.views || 0)
        case 'clicks':
          return (b.clicks || 0) - (a.clicks || 0)
        default:
          return 0
      }
    })

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
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <BannerIcon className="w-8 h-8 text-primary-500" />
            Banners
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage promotional banners displayed in the user app
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Banner
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <SearchBar
            placeholder="Search banners by title or description..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <div className="flex gap-2 items-center">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field"
            >
              <option value="priority">Sort by Priority</option>
              <option value="date">Sort by Date</option>
              <option value="views">Sort by Views</option>
              <option value="clicks">Sort by Clicks</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Banners Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Banners ({filteredBanners.length})</h2>
        </div>

        {filteredBanners.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {banners.length === 0 
                ? 'No banners yet. Create your first banner!' 
                : 'No banners match your filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBanners.map((banner) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Banner Image */}
                <div className="relative">
                  <img
                    src={banner.image || banner.imageUrl || banner.banner}
                    alt={banner.title || 'Banner'}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/800x200/cccccc/666666?text=No+Image'
                    }}
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      banner.isActive 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-500 text-white'
                    }`}>
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">
                      Priority: {banner.priority}
                    </span>
                  </div>
                </div>

                {/* Banner Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">{banner.title || 'Untitled Banner'}</h3>
                  {banner.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {banner.description}
                    </p>
                  )}
                  
                  <div className="mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs font-medium">
                      📍 Profile Screen
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                    <div>
                      <span className="font-semibold">Views:</span> {banner.views || 0}
                    </div>
                    <div>
                      <span className="font-semibold">Clicks:</span> {banner.clicks || 0}
                    </div>
                    {banner.startDate && (
                      <div>
                        <span className="font-semibold">Start:</span> {new Date(banner.startDate).toLocaleDateString()}
                      </div>
                    )}
                    {banner.endDate && (
                      <div>
                        <span className="font-semibold">End:</span> {new Date(banner.endDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        banner.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                      }`}
                    >
                      {banner.isActive ? (
                        <>
                          <XCircle className="w-4 h-4 inline mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(banner)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Edit Banner"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setBannerToDelete(banner)
                        setShowDeleteConfirm(true)
                      }}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"
                      title="Delete Banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === 'create' ? 'Create New Banner' : 'Edit Banner'}
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Banner Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter banner title (optional)"
              className="input-field"
              disabled={saving || uploading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter banner description (optional)"
              rows={3}
              className="input-field resize-none"
              disabled={saving || uploading}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Banner Image *</label>
            
            {/* Banner Size Guide */}
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    📐 Recommended Banner Size
                  </p>
                  <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                    <p className="font-medium">Option 1: Standard quality (recommended)</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>Width: <span className="font-semibold">1200px</span></li>
                      <li>Height: <span className="font-semibold">200px</span></li>
                      <li>Aspect ratio: <span className="font-semibold">6:1</span></li>
                      <li>File size: <span className="font-semibold">~50–150 KB</span> (optimized)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 items-center mb-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={saving || uploading}
                />
                <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
                  <ImageIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedImage ? selectedImage.name : 'Upload Image'}
                  </span>
                </div>
              </label>
              
              {selectedImage && (
                <button
                  onClick={removeImage}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  disabled={saving || uploading}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Image URL Input */}
            <div className="mb-2">
              <p className="text-xs text-gray-500 mb-1">OR enter image URL:</p>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => {
                  setFormData({ ...formData, imageUrl: e.target.value })
                  if (e.target.value) {
                    setImagePreview(e.target.value)
                    setSelectedImage(null)
                  }
                }}
                placeholder="https://example.com/image.jpg"
                className="input-field"
                disabled={saving || uploading || !!selectedImage}
              />
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-w-md h-48 object-contain bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  onError={() => setImagePreview(null)}
                />
              </div>
            )}
          </div>

          {/* Target Page - Fixed to Profile Screen */}
          <div>
            <label className="block text-sm font-medium mb-2">Target Page</label>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                📍 Profile Screen
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Banners are displayed only on the Profile Screen in the user app.
              </p>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Priority: {formData.priority} (1-10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className="w-full"
              disabled={saving || uploading}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low (1)</span>
              <span>High (10)</span>
            </div>
          </div>

          {/* Status - Always Active by default */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={formData.isActive === true}
                  onChange={() => setFormData({ ...formData, isActive: true })}
                  className="w-4 h-4"
                  disabled={saving || uploading}
                />
                <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={formData.isActive === false}
                  onChange={() => setFormData({ ...formData, isActive: false })}
                  className="w-4 h-4"
                  disabled={saving || uploading}
                />
                <span className="text-gray-600 dark:text-gray-400">Inactive</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ⚠️ Only Active banners will appear in the user app. New banners are Active by default.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
              disabled={saving || uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveBanner}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={saving || uploading || (!formData.imageUrl && !selectedImage)}
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {modalMode === 'create' ? 'Create Banner' : 'Update Banner'}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Banner"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this banner? This action cannot be undone.
          </p>
          {bannerToDelete && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-semibold">{bannerToDelete.title || 'Untitled Banner'}</p>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteBanner}
              className="btn-danger flex-1"
            >
              Delete Banner
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Banners
