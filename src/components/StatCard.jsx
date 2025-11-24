import { motion } from 'framer-motion'

const StatCard = ({ title, value, icon: Icon, color = 'primary', trend, delay = 0 }) => {
  const gradients = {
    primary: 'from-primary-500 to-primary-600',
    secondary: 'from-secondary-500 to-secondary-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card overflow-hidden"
    >
      <div className={`bg-gradient-to-r ${gradients[color]} h-2 mb-4 rounded-full`}></div>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{title}</p>
          <h3 className="text-3xl font-bold mb-2">{value}</h3>
          {trend && (
            <p className={`text-sm ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
              {trend.value} {trend.label}
            </p>
          )}
        </div>
        <div className={`bg-gradient-to-br ${gradients[color]} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

export default StatCard



















