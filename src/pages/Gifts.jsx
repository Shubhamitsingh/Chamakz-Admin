import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Image as ImageIcon, X, Gift, Sparkles, CheckCircle, XCircle, Filter, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import SearchBar from '../components/SearchBar'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'

const Gifts = () => {
  const { showToast, user: adminUser } = useApp()
  const [gifts, setGifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' or 'edit'
  const [selectedGift, setSelectedGift] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [giftToDelete, setGiftToDelete] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'active', 'inactive'
  const [filterCategory, setFilterCategory] = useState('all') // 'all' or specific category
  const [sortBy, setSortBy] = useState('priority') // 'priority', 'date', 'name', 'cost'
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    cost: 0,
    image: '',
    imageUrl: '',
    isActive: true,
    priority: 5
  })
  
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch gifts from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'gifts'), orderBy('priority', 'desc')),
      (snapshot) => {
        const giftsData = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            name: data.name || data.title || '',
            description: data.description || '',
            category: data.category || 'general',
            cost: data.cost || data.coins || 0,
            image: data.image || data.imageUrl || data.asset || '',
            imageUrl: data.imageUrl || data.image || data.asset || '',
            isActive: data.isActive !== undefined ? data.isActive : true,
            priority: data.priority || 5,
            usageCount: data.usageCount || 0,
            createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date(),
            updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)) : new Date(),
            ...data
          }
        })
        setGifts(giftsData)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching gifts:', error)
        if (error.code === 'permission-denied') {
          console.warn('⚠️ Firebase permission error: Please update Firestore security rules for "gifts" collection')
          setGifts([])
        } else {
          showToast('Error loading gifts', 'error')
        }
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [showToast])

  // Get unique categories from gifts
  const categories = ['all', ...new Set(gifts.map(g => g.category).filter(Boolean))]

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check if it's an image or animation file
      const isValidFile = file.type.startsWith('image/') || 
                          file.type === 'video/mp4' || 
                          file.type === 'video/webm' ||
                          file.name.endsWith('.gif') ||
                          file.name.endsWith('.webp')
      
      if (!isValidFile) {
        showToast('Please select an image, GIF, or animation file', 'error')
        return
      }
      
      if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be less than 10MB', 'error')
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
    setSelectedGift(null)
    setFormData({
      name: '',
      description: '',
      category: 'general',
      cost: 0,
      image: '',
      imageUrl: '',
      isActive: true,
      priority: 5
    })
    setSelectedImage(null)
    setImagePreview(null)
    setShowModal(true)
  }

  const openEditModal = (gift) => {
    setModalMode('edit')
    setSelectedGift(gift)
    setFormData({
      name: gift.name || '',
      description: gift.description || '',
      category: gift.category || 'general',
      cost: gift.cost || 0,
      image: gift.image || gift.imageUrl || '',
      imageUrl: gift.imageUrl || gift.image || '',
      priority: gift.priority || 5,
      isActive: gift.isActive !== undefined ? gift.isActive : true
    })
    setSelectedImage(null)
    setImagePreview(gift.image || gift.imageUrl || null)
    setShowModal(true)
  }

  const handleSaveGift = async () => {
    if (!formData.name.trim()) {
      showToast('Please enter a gift name', 'error')
      return
    }

    if (!formData.imageUrl && !selectedImage) {
      showToast('Please upload an image/animation or provide image URL', 'error')
      return
    }

    setSaving(true)
    setUploading(false)

    try {
      let imageUrl = formData.imageUrl || ''

      // Upload image/animation if provided
      if (selectedImage) {
        setUploading(true)
        const timestamp = Date.now()
        const sanitizedName = selectedImage.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filename = `gifts/${timestamp}_${sanitizedName}`
        const storageRef = ref(storage, filename)
        
        await uploadBytes(storageRef, selectedImage)
        imageUrl = await getDownloadURL(storageRef)
        setUploading(false)
      }

      const giftData = {
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        category: formData.category || 'general',
        cost: Number(formData.cost) || 0,
        image: imageUrl,
        imageUrl: imageUrl,
        asset: imageUrl,
        priority: Number(formData.priority) || 5,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        updatedAt: serverTimestamp(),
        updatedBy: adminUser?.uid || 'admin'
      }
      
      if (modalMode === 'create') {
        giftData.createdAt = serverTimestamp()
        giftData.usageCount = 0
        await addDoc(collection(db, 'gifts'), giftData)
        showToast('Gift created successfully!', 'success')
      } else {
        await updateDoc(doc(db, 'gifts', selectedGift.id), giftData)
        showToast('Gift updated successfully!', 'success')
      }

      setShowModal(false)
      setSelectedImage(null)
      setImagePreview(null)
    } catch (error) {
      console.error('Error saving gift:', error)
      showToast(`Error saving gift: ${error.message}`, 'error')
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const handleDeleteGift = async () => {
    if (!giftToDelete) return

    try {
      await deleteDoc(doc(db, 'gifts', giftToDelete.id))
      showToast('Gift deleted successfully', 'success')
      setShowDeleteConfirm(false)
      setGiftToDelete(null)
    } catch (error) {
      console.error('Error deleting gift:', error)
      showToast(`Error deleting gift: ${error.message}`, 'error')
    }
  }

  const handleToggleActive = async (gift) => {
    try {
      await updateDoc(doc(db, 'gifts', gift.id), {
        isActive: !gift.isActive,
        updatedAt: serverTimestamp()
      })
      showToast(`Gift ${!gift.isActive ? 'activated' : 'deactivated'}`, 'success')
    } catch (error) {
      console.error('Error toggling gift status:', error)
      showToast('Error updating gift status', 'error')
    }
  }

  // Filter and sort gifts
  const filteredGifts = gifts
    .filter(gift => {
      const matchesSearch = 
        (gift.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (gift.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (gift.category || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = 
        filterStatus === 'all' ||
        (filterStatus === 'active' && gift.isActive) ||
        (filterStatus === 'inactive' && !gift.isActive)
      
      const matchesCategory = 
        filterCategory === 'all' ||
        gift.category === filterCategory
      
      return matchesSearch && matchesStatus && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return b.priority - a.priority
        case 'date':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'name':
          return (a.name || '').localeCompare(b.name || '')
        case 'cost':
          return (a.cost || 0) - (b.cost || 0)
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
            <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(-5deg)' }}>
              <Gift className="w-6 h-6 text-white" />
            </div>
            Gifts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage gifts that users can send in the app
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Gift
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
            placeholder="Search gifts by name, description, or category..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <div className="flex gap-2 items-center flex-wrap">
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
            {categories.length > 1 && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input-field"
              >
                <option value="all">All Categories</option>
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            )}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field"
            >
              <option value="priority">Sort by Priority</option>
              <option value="name">Sort by Name</option>
              <option value="cost">Sort by Cost</option>
              <option value="date">Sort by Date</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Gifts Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Gifts ({filteredGifts.length})</h2>
        </div>

        {filteredGifts.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {gifts.length === 0 
                ? 'No gifts yet. Create your first gift!' 
                : 'No gifts match your filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGifts.map((gift) => (
              <motion.div
                key={gift.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Gift Image/Animation */}
                <div className="relative bg-gray-100 dark:bg-gray-800">
                  <div className="w-full h-48 flex items-center justify-center">
                    {gift.image || gift.imageUrl ? (
                      <img
                        src={gift.image || gift.imageUrl}
                        alt={gift.name || 'Gift'}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/200/cccccc/666666?text=No+Image'
                        }}
                      />
                    ) : (
                      <Gift className="w-24 h-24 text-gray-400" />
                    )}
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      gift.isActive 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-500 text-white'
                    }`}>
                      {gift.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">
                      Priority: {gift.priority}
                    </span>
                  </div>
                </div>

                {/* Gift Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{gift.name || 'Unnamed Gift'}</h3>
                  {gift.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {gift.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs font-medium capitalize">
                      {gift.category || 'general'}
                    </span>
                    {gift.cost > 0 && (
                      <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                        💰 {gift.cost} coins
                      </span>
                    )}
                  </div>
                  
                  {gift.usageCount !== undefined && (
                    <div className="text-xs text-gray-500 mb-3">
                      <span className="font-semibold">Used:</span> {gift.usageCount || 0} times
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(gift)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        gift.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                      }`}
                    >
                      {gift.isActive ? (
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
                      onClick={() => openEditModal(gift)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Edit Gift"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setGiftToDelete(gift)
                        setShowDeleteConfirm(true)
                      }}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"
                      title="Delete Gift"
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
        title={modalMode === 'create' ? 'Create New Gift' : 'Edit Gift'}
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Gift Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter gift name (e.g., Rose, Heart, Star)"
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
              placeholder="Enter gift description (optional)"
              rows={3}
              className="input-field resize-none"
              disabled={saving || uploading}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-field"
              disabled={saving || uploading}
            >
              <option value="general">General</option>
              <option value="love">Love</option>
              <option value="celebration">Celebration</option>
              <option value="funny">Funny</option>
              <option value="special">Special</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-medium mb-2">Cost (Coins)</label>
            <input
              type="number"
              min="0"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
              placeholder="0"
              className="input-field"
              disabled={saving || uploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter 0 for free gifts, or set a coin cost for premium gifts
            </p>
          </div>

          {/* Image/Animation Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Gift Asset (Image/Animation) *</label>
            
            {/* Upload Guidelines */}
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    📦 Gift Asset Guidelines
                  </p>
                  <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                    <p className="font-medium">Supported formats:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>Images: PNG, JPG, WebP</li>
                      <li>Animations: GIF, MP4, WebM</li>
                      <li>Recommended size: 200x200px to 500x500px</li>
                      <li>File size: Max 10MB</li>
                      <li>For best results, use transparent backgrounds (PNG)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 items-center mb-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*,video/mp4,video/webm"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={saving || uploading}
                />
                <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
                  <ImageIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedImage ? selectedImage.name : 'Upload Image/Animation'}
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
              <p className="text-xs text-gray-500 mb-1">OR enter image/animation URL:</p>
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
                placeholder="https://example.com/gift.gif"
                className="input-field"
                disabled={saving || uploading || !!selectedImage}
              />
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-3">
                <div className="w-full max-w-md h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  {imagePreview.includes('.mp4') || imagePreview.includes('.webm') ? (
                    <video
                      src={imagePreview}
                      className="max-w-full max-h-full object-contain"
                      autoPlay
                      loop
                      muted
                      onError={() => setImagePreview(null)}
                    />
                  ) : (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                      onError={() => setImagePreview(null)}
                    />
                  )}
                </div>
              </div>
            )}
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
            <p className="text-xs text-gray-500 mt-1">
              Higher priority gifts appear first in the user app
            </p>
          </div>

          {/* Status */}
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
              ⚠️ Only Active gifts will appear in the user app. New gifts are Active by default.
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
              onClick={handleSaveGift}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={saving || uploading || !formData.name.trim() || (!formData.imageUrl && !selectedImage)}
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
                  {modalMode === 'create' ? 'Create Gift' : 'Update Gift'}
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
        title="Delete Gift"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this gift? This action cannot be undone.
          </p>
          {giftToDelete && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-semibold">{giftToDelete.name || 'Unnamed Gift'}</p>
              {giftToDelete.usageCount > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  ⚠️ This gift has been used {giftToDelete.usageCount} times
                </p>
              )}
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
              onClick={handleDeleteGift}
              className="btn-danger flex-1"
            >
              Delete Gift
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Gifts
