const Loader = ({ size = 'md', fullScreen = false }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
  }

  const loader = (
    <div className="flex items-center justify-center">
      <div className={`${sizes[size]} border-gray-200 border-t-gray-900 dark:border-gray-700 dark:border-t-white rounded-full animate-spin`} />
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
        {loader}
      </div>
    )
  }

  return loader
}

export default Loader
