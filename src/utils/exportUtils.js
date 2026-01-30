/**
 * Export Utilities
 * Functions to export data to CSV, Excel, and PDF formats
 */

/**
 * Export data to CSV format
 */
export const exportToCSV = (data, filename = 'export', headers = null) => {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  try {
    // Get headers from first object if not provided
    const csvHeaders = headers || Object.keys(data[0])
    
    // Create CSV content
    const csvContent = [
      // Header row
      csvHeaders.join(','),
      // Data rows
      ...data.map(row => {
        return csvHeaders.map(header => {
          const value = row[header] || ''
          // Escape commas and quotes, wrap in quotes if contains comma or quote
          const stringValue = String(value).replace(/"/g, '""')
          return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
            ? `"${stringValue}"`
            : stringValue
        }).join(',')
      })
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
    
    return true
  } catch (error) {
    console.error('Error exporting to CSV:', error)
    throw error
  }
}

/**
 * Export data to Excel format (CSV with .xlsx extension)
 * Note: For true Excel format, you'd need a library like xlsx
 */
export const exportToExcel = (data, filename = 'export', headers = null) => {
  // For now, export as CSV with .xlsx extension
  // In production, you might want to use a library like 'xlsx'
  return exportToCSV(data, filename, headers)
}

/**
 * Export data to JSON format
 */
export const exportToJSON = (data, filename = 'export') => {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  try {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
    
    return true
  } catch (error) {
    console.error('Error exporting to JSON:', error)
    throw error
  }
}

/**
 * Prepare table data for export
 * Converts complex objects to simple key-value pairs
 */
export const prepareDataForExport = (data, columnMapping = null) => {
  if (!data || data.length === 0) return []

  return data.map((item, index) => {
    const exportItem = {}
    
    if (columnMapping) {
      // Use custom mapping
      Object.keys(columnMapping).forEach(key => {
        const value = columnMapping[key](item)
        exportItem[key] = value !== null && value !== undefined ? String(value) : ''
      })
    } else {
      // Auto-map all properties
      Object.keys(item).forEach(key => {
        const value = item[key]
        
        // Skip functions and complex objects
        if (typeof value === 'function') return
        if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
          exportItem[key] = JSON.stringify(value)
        } else if (value instanceof Date) {
          exportItem[key] = value.toLocaleString()
        } else {
          exportItem[key] = value !== null && value !== undefined ? String(value) : ''
        }
      })
    }
    
    return exportItem
  })
}

/**
 * Export table data with column mapping
 */
export const exportTableData = (data, columns, filename, format = 'csv') => {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  if (!columns || !Array.isArray(columns) || columns.length === 0) {
    console.warn('No columns provided for export')
    return
  }

  // Create column mapping from table columns
  const columnMapping = {}
  const headers = []
  
  columns.forEach(col => {
    const header = col.header || col.label || col.accessor || col.key
    const accessor = col.accessor || col.key
    
    if (header && accessor) {
      headers.push(header)
      columnMapping[header] = (row) => {
        if (col.render) {
          // For rendered columns, get the raw value
          return row[accessor] || ''
        }
        return row[accessor] || ''
      }
    }
  })

  // Prepare data
  const exportData = data.map(row => {
    const exportRow = {}
    columns.forEach(col => {
      const header = col.header || col.label || col.accessor || col.key
      const accessor = col.accessor || col.key
      
      if (header && accessor) {
        const value = row[accessor]
        // Convert to string, handling special cases
        if (value === null || value === undefined) {
          exportRow[header] = ''
        } else if (typeof value === 'object') {
          exportRow[header] = JSON.stringify(value)
        } else {
          exportRow[header] = String(value)
        }
      }
    })
    return exportRow
  })

  // Export based on format
  switch (format.toLowerCase()) {
    case 'csv':
      return exportToCSV(exportData, filename, headers)
    case 'excel':
    case 'xlsx':
      return exportToExcel(exportData, filename, headers)
    case 'json':
      return exportToJSON(exportData, filename)
    default:
      return exportToCSV(exportData, filename, headers)
  }
}
