import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'

const ContentManagement = () => {
  const { data, addBanner, deleteBanner, showToast } = useApp()
  const [showBannerModal, setShowBannerModal] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [newBanner, setNewBanner] = useState({ title: '', image: '', startDate: '', endDate: '' })

  const handleAddBanner = () => {
    if (!newBanner.title || !newBanner.image) {
      showToast('Please fill all required fields', 'error')
      return
    }

    addBanner({
      title: newBanner.title,
      image: newBanner.image,
      active: true,
      startDate: newBanner.startDate,
      endDate: newBanner.endDate,
    })

    setShowBannerModal(false)
    setNewBanner({ title: '', image: '', startDate: '', endDate: '' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Content Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage banners, announcements, and promotional content</p>
      </motion.div>

      {/* Banners Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Banners</h2>
          <button
            onClick={() => setShowBannerModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Banner
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.banners.map((banner, index) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <div className="relative">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-48 object-cover"
                />
                <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-medium ${
                  banner.active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}>
                  {banner.active ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{banner.title}</h3>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span>Start: {banner.startDate}</span>
                  <span>End: {banner.endDate}</span>
                </div>
                <button
                  onClick={() => deleteBanner(banner.id)}
                  className="btn-danger w-full flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Banner
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Announcements Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Announcements</h2>
          <button
            onClick={() => setShowAnnouncementModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Announcement
          </button>
        </div>

        <div className="space-y-4">
          {data.announcements.map((announcement, index) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">{announcement.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      announcement.priority === 'High' ? 'bg-red-100 text-red-700' :
                      announcement.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {announcement.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">{announcement.message}</p>
                  <p className="text-sm text-gray-500">Published: {announcement.date}</p>
                </div>
                <button
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Add Banner Modal */}
      <Modal
        isOpen={showBannerModal}
        onClose={() => setShowBannerModal(false)}
        title="Add New Banner"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Banner Title *</label>
            <input
              type="text"
              value={newBanner.title}
              onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
              placeholder="Enter banner title"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Image URL *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBanner.image}
                onChange={(e) => setNewBanner({ ...newBanner, image: e.target.value })}
                placeholder="Enter image URL or upload"
                className="input-field flex-1"
              />
              <button className="btn-secondary px-4">
                <Upload className="w-5 h-5" />
              </button>
            </div>
            {newBanner.image && (
              <div className="mt-3 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <img src={newBanner.image} alt="Preview" className="w-full h-32 object-cover" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={newBanner.startDate}
                onChange={(e) => setNewBanner({ ...newBanner, startDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={newBanner.endDate}
                onChange={(e) => setNewBanner({ ...newBanner, endDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={() => setShowBannerModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button onClick={handleAddBanner} className="btn-primary flex-1">
              Add Banner
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Announcement Modal */}
      <Modal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        title="Add New Announcement"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Announcement Title</label>
            <input
              type="text"
              placeholder="Enter title"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              rows="4"
              placeholder="Enter announcement message"
              className="input-field"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <select className="input-field">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={() => setShowAnnouncementModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                showToast('Announcement added successfully')
                setShowAnnouncementModal(false)
              }}
              className="btn-secondary flex-1"
            >
              Add Announcement
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ContentManagement



















