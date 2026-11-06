import { useState, useEffect } from 'react'
import { Eye, CheckCircle, XCircle, Clock, AlertCircle, UserCheck, UserX } from 'lucide-react'
import { useApp } from '../context/AppContext'
import SearchBar from '../components/SearchBar'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'
import KpiCard from '../components/KpiCard'
import { collection, doc, updateDoc, onSnapshot, query, orderBy, serverTimestamp, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'

const HostApplications = () => {
  const { showToast, markHostApplicationsAsSeen } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All') // All, Pending, Approved, Rejected
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [collectionName, setCollectionName] = useState(null)
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [applicationToProcess, setApplicationToProcess] = useState(null)

  // Fetch host applications from Firebase
  useEffect(() => {
    let unsubscribe = null
    let isMounted = true

    const fetchApplications = async () => {
      try {
        if (!db) {
          throw new Error('Firebase database not initialized')
        }

        console.log('🔍 Setting up real-time listener for host applications...')

        // Try different collection name variations
        const collectionNames = ['hosts_application', 'host_application', 'host_applications', 'hostApplications']
        let applicationsCollection = null
        let collectionName = null

        // First, try to find the collection by testing each one
        for (const name of collectionNames) {
          try {
            const testCollection = collection(db, name)
            const testQuery = query(testCollection)
            const testSnapshot = await getDocs(testQuery)
            applicationsCollection = testCollection
            collectionName = name
            setCollectionName(name)
            console.log(`✅ Found collection: ${name} with ${testSnapshot.size} documents`)
            // Log first document structure if exists
            if (testSnapshot.size > 0) {
              const sampleData = testSnapshot.docs[0].data()
              console.log('📄 Sample document:', testSnapshot.docs[0].id, sampleData)
            }
            break
          } catch (err) {
            console.log(`⚠️ Collection ${name} not accessible:`, err.code, err.message)
            // Continue to next collection
          }
        }

        // If no collection found, use the primary one anyway (might be empty)
        if (!applicationsCollection) {
          console.log('⚠️ No accessible collection found, using primary: hosts_application')
          applicationsCollection = collection(db, 'hosts_application')
          collectionName = 'hosts_application'
        }

        console.log(`📡 Setting up real-time listener on: ${collectionName}`)

        // Start with simple query (no orderBy) to ensure it works
        // We'll sort in JavaScript if needed
        let applicationsQuery = query(applicationsCollection)
        console.log('✅ Using simple query (no orderBy) for maximum compatibility')
        
        // Try to add orderBy if possible, but don't fail if it doesn't work
        try {
          // Check if we have any documents first
          const testSnapshot = await getDocs(query(applicationsCollection))
          if (testSnapshot.size > 0) {
            const firstDoc = testSnapshot.docs[0].data()
            console.log('📋 First document fields:', Object.keys(firstDoc))
            
            // Try orderBy if createdAt exists
            if (firstDoc.createdAt || firstDoc.timestamp || firstDoc.created_at) {
              try {
                applicationsQuery = query(applicationsCollection, orderBy('createdAt', 'desc'))
                console.log('✅ Using query with orderBy(createdAt, desc)')
              } catch (orderErr) {
                console.warn('⚠️ orderBy failed, using simple query:', orderErr.message)
                applicationsQuery = query(applicationsCollection)
              }
            }
          }
        } catch (testErr) {
          console.warn('⚠️ Could not test query, using simple query:', testErr.message)
          applicationsQuery = query(applicationsCollection)
        }

        // Set up real-time listener
        const listenerCallback = async (snapshot) => {
          console.log(`📥 Real-time update: ${snapshot.size} documents received`)
          console.log('📥 Snapshot metadata:', {
            hasPendingWrites: snapshot.metadata.hasPendingWrites,
            fromCache: snapshot.metadata.fromCache
          })
          
          if (!isMounted) {
            console.log('⚠️ Component unmounted, ignoring update')
            return
          }

          if (snapshot.empty) {
            console.log('⚠️ Snapshot is empty - no documents in collection')
            if (isMounted) {
              setApplications([])
              setLoading(false)
              setError(null)
            }
            return
          }

          try {
            const applicationsData = []
            console.log(`🔄 Processing ${snapshot.docs.length} documents...`)

            // Process all documents with Promise.all to handle async operations
            const processPromises = snapshot.docs.map(async (docSnapshot) => {
              try {
                console.log(`📄 Processing document: ${docSnapshot.id}`)
                
                if (!docSnapshot.exists()) {
                  console.warn(`⚠️ Document ${docSnapshot.id} does not exist`)
                  return null
                }

                const data = docSnapshot.data()
                console.log(`📋 Document ${docSnapshot.id} data:`, data)
                
                if (!data) {
                  console.warn(`⚠️ Document ${docSnapshot.id} has no data`)
                  return null
                }

                // Parse dates safely - try multiple field name variations
                let applicationDate = 'N/A'
                let reviewedDate = 'N/A'

                // Try to find application date from various field names
                const dateField = data.createdAt || data.created_at || data.timestamp || data.appliedDate || data.applied_date || data.date || data.submittedAt || data.submitted_at
                
                if (dateField) {
                  try {
                    let date = null
                    
                    // Handle Firestore Timestamp
                    if (dateField.toDate && typeof dateField.toDate === 'function') {
                      date = dateField.toDate()
                    }
                    // Handle Firestore Timestamp (seconds/nanoseconds)
                    else if (dateField.seconds) {
                      date = new Date(dateField.seconds * 1000)
                    }
                    // Handle string or number
                    else {
                      date = new Date(dateField)
                    }
                    
                    if (date && !isNaN(date.getTime())) {
                      applicationDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      console.log(`✅ Parsed application date for ${docSnapshot.id}: ${applicationDate}`)
                    } else {
                      console.warn(`⚠️ Invalid date for ${docSnapshot.id}:`, dateField)
                    }
                  } catch (e) {
                    console.warn(`⚠️ Date parse error for ${docSnapshot.id}:`, e, 'Field:', dateField)
                  }
                } else {
                  console.warn(`⚠️ No date field found for application ${docSnapshot.id}. Available fields:`, Object.keys(data))
                }

                if (data.reviewedDate || data.updatedAt) {
                  try {
                    const date = (data.reviewedDate || data.updatedAt).toDate
                      ? (data.reviewedDate || data.updatedAt).toDate()
                      : new Date(data.reviewedDate || data.updatedAt)
                    if (!isNaN(date.getTime())) {
                      reviewedDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    }
                  } catch (e) {
                    console.warn('Date parse error for reviewedDate:', e)
                  }
                }

                // Get user details - try multiple field name variations
                let userName = data.userName || data.name || data.displayName || data.user_name || 'Unknown User'
                let userEmail = data.userEmail || data.email || data.user_email || 'No email'
                let userPhone = data.userPhone || data.phone || data.phoneNumber || data.user_phone || 'N/A'
                let numericUserId = data.numericUserId || data.userNumericId || data.numeric_user_id || data.userId || 'N/A'

                // Try to get userId from various field names
                const userId = data.userId || data.user_id || data.uid || data.userID || ''

                if (userId) {
                  try {
                    const userRef = doc(db, 'users', userId)
                    const userSnap = await getDoc(userRef)
                    if (userSnap.exists()) {
                      const userData = userSnap.data()
                      userName = userData.name || userData.displayName || userData.userName || userName
                      userEmail = userData.email || userEmail
                      userPhone = userData.phone || userData.phoneNumber || userPhone
                      numericUserId = userData.numericUserId || numericUserId
                      console.log(`✅ Fetched user details for ${userId}:`, { userName, userEmail, numericUserId })
                    } else {
                      console.warn(`⚠️ User document ${userId} does not exist`)
                    }
                  } catch (err) {
                    console.warn(`⚠️ Could not fetch user details for ${userId}:`, err)
                  }
                } else {
                  console.log(`ℹ️ No userId found in document ${docSnapshot.id}, using data from application`)
                }

                const status = data.status || data.applicationStatus || 'pending'
                const statusLower = String(status).toLowerCase()

                const processedApp = {
                  id: docSnapshot.id,
                  userId: userId,
                  numericUserId: numericUserId,
                  userName: userName,
                  userEmail: userEmail,
                  userPhone: userPhone,
                  status: statusLower === 'pending' ? 'Pending' : statusLower === 'approved' ? 'Approved' : statusLower === 'rejected' ? 'Rejected' : 'Pending',
                  applicationDate: applicationDate,
                  reviewedDate: reviewedDate,
                  reviewedBy: data.reviewedBy || data.reviewed_by || 'N/A',
                  reason: data.reason || data.applicationReason || data.message || data.application_reason || 'No reason provided',
                  experience: data.experience || data.experienceDescription || data.experience_description || 'N/A',
                  bio: data.bio || data.description || 'N/A',
                  documents: data.documents || data.document || {},
                  category: data.category || 'N/A',
                  createdAt: data.createdAt || data.created_at || data.timestamp,
                  updatedAt: data.updatedAt || data.updated_at,
                  reviewedAt: data.reviewedDate || data.reviewed_date,
                  // Raw data for modal
                  rawData: data
                }

                console.log(`✅ Successfully processed application ${docSnapshot.id}:`, {
                  userName: processedApp.userName,
                  status: processedApp.status,
                  numericUserId: processedApp.numericUserId
                })

                return processedApp
              } catch (err) {
                console.error(`❌ Error processing application ${docSnapshot.id}:`, err)
                console.error('Error stack:', err.stack)
                return null
              }
            })

            // Wait for all promises to resolve
            const results = await Promise.all(processPromises)
            const validApplications = results.filter(app => app !== null)
            const nullCount = results.length - validApplications.length

            console.log(`✅ Processed ${validApplications.length} valid applications out of ${snapshot.docs.length} documents`)
            if (nullCount > 0) {
              console.warn(`⚠️ ${nullCount} documents were filtered out (returned null)`)
            }
            
            // Log all processed applications for debugging
            if (validApplications.length > 0) {
              console.log('📋 All processed applications:', validApplications.map(app => ({
                id: app.id,
                userName: app.userName,
                status: app.status,
                numericUserId: app.numericUserId
              })))
            } else {
              console.warn('⚠️ No valid applications after processing!')
              console.warn('📋 Raw document IDs:', snapshot.docs.map(doc => doc.id))
              if (snapshot.docs.length > 0) {
                console.warn('📋 First document raw data:', snapshot.docs[0].data())
              }
            }
            
            // Sort by date if we have createdAt (since we might not have orderBy)
            validApplications.sort((a, b) => {
              if (!a.createdAt || !b.createdAt) return 0
              const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
              const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
              return dateB - dateA // Descending order
            })

            if (isMounted) {
              setApplications(validApplications)
              setLoading(false)
              setError(null)
              console.log('✅ Applications state updated with', validApplications.length, 'items')
              
              // Mark host applications as seen when page loads
              if (markHostApplicationsAsSeen) {
                markHostApplicationsAsSeen()
              }
              
              // Log first application for debugging
              if (validApplications.length > 0) {
                console.log('📋 First application:', validApplications[0])
              }
            }
          } catch (err) {
            console.error('❌ Error processing applications:', err)
            if (isMounted) {
              setError(err.message || 'Error processing applications')
              setLoading(false)
            }
          }
        }

        const errorCallback = (error) => {
          console.error('❌ Error in real-time listener:', error)
          console.error('Error code:', error.code)
          console.error('Error message:', error.message)
          if (isMounted) {
            if (error.code === 'permission-denied') {
              setError('Permission denied. Please check Firestore security rules for "hosts_application" collection.')
              console.error('⚠️ Firebase permission error: Please update Firestore security rules for "hosts_application" collection')
            } else if (error.code === 'failed-precondition') {
              // If index error, try simple query
              console.warn('⚠️ Index error, trying simple query without orderBy')
              try {
                const simpleQuery = query(applicationsCollection)
                unsubscribe = onSnapshot(simpleQuery, listenerCallback, errorCallback)
                console.log('✅ Real-time listener set up with simple query (no orderBy)')
                return
              } catch (simpleError) {
                setError('Index required. Please create a Firestore index for the query.')
                console.error('⚠️ Index error: Create a composite index in Firebase Console')
              }
            } else {
              setError(`Error: ${error.message}`)
            }
            setLoading(false)
          }
        }

        // Try to set up listener with ordered query first
        try {
          unsubscribe = onSnapshot(applicationsQuery, listenerCallback, errorCallback)
          console.log('✅ Real-time listener set up successfully')
        } catch (listenerError) {
          console.warn('⚠️ Error setting up ordered listener, trying simple query:', listenerError)
          // Fallback to simple query if ordered query fails
          try {
            const simpleQuery = query(applicationsCollection)
            unsubscribe = onSnapshot(simpleQuery, listenerCallback, errorCallback)
            console.log('✅ Real-time listener set up with simple query')
          } catch (simpleError) {
            console.error('❌ Failed to set up listener even with simple query:', simpleError)
            if (isMounted) {
              setError(`Failed to set up real-time listener: ${simpleError.message}`)
              setLoading(false)
            }
          }
        }
      } catch (error) {
        console.error('Error setting up host applications listener:', error)
        if (isMounted) {
          setError(error.message)
          setLoading(false)
        }
      }
    }

    fetchApplications()

    return () => {
      isMounted = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // Handle approve application
  const handleApprove = async (applicationId, userId) => {
    setApplicationToProcess({ id: applicationId, userId, action: 'approve' })
    setShowApproveConfirm(true)
  }

  const confirmApprove = async () => {
    if (!applicationToProcess) return

    setProcessing(true)
    setShowApproveConfirm(false)
    
    const { id: applicationId, userId } = applicationToProcess
    try {
      const applicationRef = doc(db, collectionName || 'hosts_application', applicationId)
      
      // Update application status
      await updateDoc(applicationRef, {
        status: 'approved',
        reviewedDate: serverTimestamp(),
        reviewedBy: 'admin',
        updatedAt: serverTimestamp()
      })

      // Update user document to mark as host
      if (userId) {
        try {
          const userRef = doc(db, 'users', userId)
          const userSnap = await getDoc(userRef)
          
          if (userSnap.exists()) {
            await updateDoc(userRef, {
              role: 'Host',
              isHost: true,
              hostStatus: 'approved',
              hostApprovalDate: serverTimestamp(),
              hostApplicationId: applicationId,
              updatedAt: serverTimestamp()
            })
          }
        } catch (userError) {
          console.warn('Could not update user document:', userError)
          // Still show success for application approval
        }
      }

      showToast('Host application approved successfully!', 'success')
      setShowApplicationModal(false)
      setSelectedApplication(null)
      setApplicationToProcess(null)
    } catch (error) {
      console.error('Error approving application:', error)
      showToast(`Error approving application: ${error.message}`, 'error')
    } finally {
      setProcessing(false)
      setApplicationToProcess(null)
    }
  }

  // Handle reject application
  const handleReject = async (applicationId, userId) => {
    setApplicationToProcess({ id: applicationId, userId, action: 'reject' })
    setShowRejectConfirm(true)
  }

  const confirmReject = async () => {
    if (!applicationToProcess) return

    setProcessing(true)
    setShowRejectConfirm(false)
    
    const { id: applicationId, userId } = applicationToProcess
    try {
      const applicationRef = doc(db, collectionName || 'hosts_application', applicationId)
      
      // Update application status
      await updateDoc(applicationRef, {
        status: 'rejected',
        reviewedDate: serverTimestamp(),
        reviewedBy: 'admin',
        updatedAt: serverTimestamp()
      })

      // Update user document if needed
      if (userId) {
        try {
          const userRef = doc(db, 'users', userId)
          const userSnap = await getDoc(userRef)
          
          if (userSnap.exists()) {
            await updateDoc(userRef, {
              hostStatus: 'rejected',
              hostApplicationId: applicationId,
              updatedAt: serverTimestamp()
            })
          }
        } catch (userError) {
          console.warn('Could not update user document:', userError)
        }
      }

      showToast('Host application rejected.', 'success')
      setShowApplicationModal(false)
      setSelectedApplication(null)
      setApplicationToProcess(null)
    } catch (error) {
      console.error('Error rejecting application:', error)
      showToast(`Error rejecting application: ${error.message}`, 'error')
    } finally {
      setProcessing(false)
      setApplicationToProcess(null)
    }
  }

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.numericUserId.toString().includes(searchTerm) ||
      app.reason.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'All' || app.status === filterStatus

    return matchesSearch && matchesStatus
  })

  // Table columns
  const columns = [
    { 
      header: 'User ID', 
      accessor: 'numericUserId',
      render: (row) => <span className="font-mono font-semibold">{row?.numericUserId || 'N/A'}</span>
    },
    { 
      header: 'Name', 
      accessor: 'userName',
      render: (row) => <span className="font-medium">{row?.userName || 'N/A'}</span>
    },
    { 
      header: 'Email', 
      accessor: 'userEmail',
      render: (row) => <span>{row?.userEmail || 'N/A'}</span>
    },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => {
        const status = row?.status || 'Pending'
        return (
          <StatusBadge tone={status === 'Approved' ? 'success' : status === 'Rejected' ? 'danger' : 'warning'}>
            {status}
          </StatusBadge>
        )
      }
    },
    { 
      header: 'Applied Date', 
      accessor: 'applicationDate',
      render: (row) => <span>{row?.applicationDate || 'N/A'}</span>
    },
    { 
      header: 'Actions', 
      render: (row) => {
        if (!row) return null
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedApplication(row)
                setShowApplicationModal(true)
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            {row.status === 'Pending' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleApprove(row.id, row.userId)
                  }}
                  disabled={processing}
                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Approve"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleReject(row.id, row.userId)
                  }}
                  disabled={processing}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Reject"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )
      }
    }
  ]

  // Table rows - just use the applications directly since we're using render functions
  const tableRows = filteredApplications

  // Status counts
  const statusCounts = {
    All: applications.length,
    Pending: applications.filter((app) => app.status === 'Pending').length,
    Approved: applications.filter((app) => app.status === 'Approved').length,
    Rejected: applications.filter((app) => app.status === 'Rejected').length
  }

  if (loading) {
    return (
      <div className="page-shell">
        <PageHeader title="Host applications" description="Loading applications..." />
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader />
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <PageHeader title="Host applications" description="Review and approve host account applications." />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Could not load applications</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <KpiCard title="Total" value={statusCounts.All} icon={UserCheck} />
        <KpiCard title="Pending" value={statusCounts.Pending} icon={Clock} />
        <KpiCard title="Approved" value={statusCounts.Approved} icon={CheckCircle} />
        <KpiCard title="Rejected" value={statusCounts.Rejected} icon={UserX} />
      </div>

      <div className="filter-bar">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search name, email, user ID, or reason"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs border rounded-md px-2 py-1.5 bg-transparent"
        >
          <option value="All">All status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <Panel title="Applications" action={<span className="text-[11px] text-gray-500">{filteredApplications.length} shown</span>} padded={false}>
        {filteredApplications.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title={applications.length === 0 ? 'No host applications' : 'No applications match your search'}
            description={applications.length === 0
              ? 'Applications appear here when users apply to host.'
              : 'Try adjusting search or filters.'}
          />
        ) : (
          <Table columns={columns} data={tableRows} />
        )}
      </Panel>

      {/* Application Detail Modal */}
      <Modal
        isOpen={showApplicationModal}
        onClose={() => {
          setShowApplicationModal(false)
          setSelectedApplication(null)
        }}
        title="Host Application Details"
      >
        {selectedApplication && (
          <div className="space-y-6">
            {/* User Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                User Information
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedApplication.numericUserId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedApplication.userName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedApplication.userEmail}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedApplication.userPhone}
                  </span>
                </div>
              </div>
            </div>

            {/* Application Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Application Details
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block mb-1">Status:</span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedApplication.status === 'Approved'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : selectedApplication.status === 'Rejected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}
                  >
                    {selectedApplication.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block mb-1">Applied Date:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedApplication.applicationDate}
                  </span>
                </div>
                {selectedApplication.reviewedDate !== 'N/A' && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 block mb-1">Reviewed Date:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedApplication.reviewedDate}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block mb-1">Reason:</span>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">
                    {selectedApplication.reason}
                  </p>
                </div>
                {selectedApplication.experience !== 'N/A' && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 block mb-1">Experience:</span>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {selectedApplication.experience}
                    </p>
                  </div>
                )}
                {selectedApplication.bio !== 'N/A' && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 block mb-1">Bio:</span>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {selectedApplication.bio}
                    </p>
                  </div>
                )}
                {selectedApplication.category !== 'N/A' && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 block mb-1">Category:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedApplication.category}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            {selectedApplication.documents && Object.keys(selectedApplication.documents).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Documents
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                  {Object.entries(selectedApplication.documents).map(([key, url]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      {url && typeof url === 'string' && url.startsWith('http') ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          View Document
                        </a>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-500 text-sm">N/A</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {selectedApplication.status === 'Pending' && (
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleApprove(selectedApplication.id, selectedApplication.userId)}
                  disabled={processing}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve Application
                </button>
                <button
                  onClick={() => handleReject(selectedApplication.id, selectedApplication.userId)}
                  disabled={processing}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Reject Application
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={showApproveConfirm}
        onClose={() => {
          setShowApproveConfirm(false)
          setApplicationToProcess(null)
        }}
        title="Approve Host Application"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300 mb-1">
                Are you sure you want to approve this host application?
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                This will grant the user host privileges and allow them to start hosting on the platform.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setShowApproveConfirm(false)
                setApplicationToProcess(null)
              }}
              className="btn-secondary flex-1"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              onClick={confirmApprove}
              className="btn-primary flex-1 disabled:opacity-50"
              disabled={processing}
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Approve Application
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={showRejectConfirm}
        onClose={() => {
          setShowRejectConfirm(false)
          setApplicationToProcess(null)
        }}
        title="Reject Host Application"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300 mb-1">
                Are you sure you want to reject this host application?
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">
                This action will deny the user host privileges. They can apply again in the future.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setShowRejectConfirm(false)
                setApplicationToProcess(null)
              }}
              className="btn-secondary flex-1"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              onClick={confirmReject}
              className="btn-danger flex-1 disabled:opacity-50"
              disabled={processing}
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  Reject Application
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default HostApplications
