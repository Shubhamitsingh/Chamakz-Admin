const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`text-center py-10 px-4 ${className}`}>
      {Icon && (
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-center">
            <Icon className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {description && <p className="mt-1 text-xs text-gray-500 max-w-md mx-auto">{description}</p>}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="btn-primary mt-3">
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState
