const Table = ({ columns, data, onRowClick }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 border-b border-gray-100 dark:border-gray-700">
            {columns.map((column, index) => (
              <th key={index} className="py-2 px-3 font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={`border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/40 ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((column, colIndex) => {
                let cellContent = null
                if (column.render) {
                  cellContent = column.render(row)
                } else {
                  const value = row[column.accessor]
                  if (value && typeof value === 'object') {
                    if (value.toDate && typeof value.toDate === 'function') {
                      try {
                        cellContent = new Date(value.toDate()).toLocaleDateString()
                      } catch {
                        cellContent = 'N/A'
                      }
                    } else if (value.seconds !== undefined) {
                      try {
                        cellContent = new Date(value.seconds * 1000).toLocaleDateString()
                      } catch {
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
                  <td key={colIndex} className="py-2 px-3 whitespace-nowrap align-middle">
                    {cellContent}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table
