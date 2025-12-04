import { motion } from 'framer-motion'

const Table = ({ columns, data, onRowClick }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-200 dark:border-gray-700">
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <motion.tr
              key={rowIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: rowIndex * 0.05 }}
              onClick={() => onRowClick && onRowClick(row)}
              className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((column, colIndex) => {
                let cellContent = null
                if (column.render) {
                  cellContent = column.render(row)
                } else {
                  const value = row[column.accessor]
                  // Convert Firebase Timestamps and other objects to strings
                  if (value && typeof value === 'object') {
                    if (value.toDate && typeof value.toDate === 'function') {
                      // Firebase Timestamp
                      try {
                        cellContent = new Date(value.toDate()).toLocaleDateString()
                      } catch (e) {
                        cellContent = 'N/A'
                      }
                    } else if (value.seconds !== undefined) {
                      // Timestamp-like object
                      try {
                        cellContent = new Date(value.seconds * 1000).toLocaleDateString()
                      } catch (e) {
                        cellContent = 'N/A'
                      }
                    } else {
                      cellContent = String(value)
                    }
                  } else {
                    cellContent = value ?? 'N/A'
                  }
                }
                return (
                  <td key={colIndex} className="px-4 py-3 text-sm">
                    {cellContent}
                  </td>
                )
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table



















