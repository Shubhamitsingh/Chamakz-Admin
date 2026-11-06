export const getStorage = () => ({ mock: true })

export const ref = (_storage, path = '') => ({ path, file: null })

export const uploadBytes = async (storageRef, file) => {
  storageRef.file = file
  return { ref: storageRef }
}

export const getDownloadURL = async (storageRef) => {
  if (storageRef?.file instanceof Blob) {
    return URL.createObjectURL(storageRef.file)
  }
  return storageRef?.path || 'https://placehold.co/800x240/111827/ffffff?text=Upload'
}
