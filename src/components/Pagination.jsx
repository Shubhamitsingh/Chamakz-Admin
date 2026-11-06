import { ChevronLeft, ChevronRight } from 'lucide-react'

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  className = '',
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)
      if (currentPage <= 3) end = Math.min(4, totalPages - 1)
      if (currentPage >= totalPages - 2) start = Math.max(2, totalPages - 3)
      if (start > 2) pages.push('...')
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < totalPages - 1) pages.push('...')
      if (totalPages > 1) pages.push(totalPages)
    }

    return pages
  }

  if (totalPages <= 1 && !showItemsPerPage) return null

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}>
      <div className="text-xs text-gray-500">
        Showing <span className="font-medium text-gray-900 dark:text-gray-100">{startItem}</span> to{' '}
        <span className="font-medium text-gray-900 dark:text-gray-100">{endItem}</span> of{' '}
        <span className="font-medium text-gray-900 dark:text-gray-100">{totalItems}</span>
      </div>

      <div className="flex items-center gap-3">
        {showItemsPerPage && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Per page</label>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange && onItemsPerPageChange(Number(e.target.value))}
              className="text-xs border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-transparent"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 rounded-md border border-gray-200 dark:border-gray-700 disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-1 text-xs text-gray-400">
                    ...
                  </span>
                )
              }
              const isActive = page === currentPage
              return (
                <button
                  type="button"
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`min-w-[28px] h-7 px-2 rounded-md text-xs ${
                    isActive
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md border border-gray-200 dark:border-gray-700 disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Pagination
