import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, FileJson, ChevronDown } from 'lucide-react'
import { exportTableData } from '../utils/exportUtils'

/**
 * Export Button Component
 * Provides dropdown menu for exporting data in different formats
 */
const ExportButton = ({
  data = [],
  columns = [],
  filename = 'export',
  className = '',
  disabled = false
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExport = async (format) => {
    if (!data || data.length === 0) {
      alert('No data to export')
      return
    }

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      alert('No columns defined for export')
      return
    }

    setExporting(true)
    setShowMenu(false)

    try {
      await exportTableData(data, columns, filename, format)
      // Success - could show toast here
    } catch (error) {
      console.error('Export error:', error)
      alert(`Error exporting data: ${error.message}`)
    } finally {
      setExporting(false)
    }
  }

  if (disabled || !data || data.length === 0 || !columns || !Array.isArray(columns)) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={exporting || disabled}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="w-4 h-4" />
        {exporting ? 'Exporting...' : 'Export'}
        <ChevronDown className="w-4 h-4" />
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="py-1">
              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export as Excel
              </button>
              <button
                onClick={() => handleExport('json')}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FileJson className="w-4 h-4" />
                Export as JSON
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ExportButton
