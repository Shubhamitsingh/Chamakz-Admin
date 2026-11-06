const Panel = ({ title, action, children, padded = true, className = '' }) => (
  <section className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
        {title ? <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2> : <span />}
        {action}
      </div>
    )}
    <div className={`${padded ? 'p-4' : ''} flex-1 min-h-0`}>{children}</div>
  </section>
)

export default Panel
