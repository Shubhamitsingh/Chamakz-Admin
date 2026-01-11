import { motion } from 'framer-motion'

const Table = ({ columns, data, onRowClick }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {data.map((row, rowIndex) => (
            <motion.tr
              key={rowIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: rowIndex * 0.05 }}
              onClick={() => onRowClick && onRowClick(row)}
              className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
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
                  <td key={colIndex} className="px-6 py-4 text-sm whitespace-nowrap">
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



















