import { motion } from 'framer-motion'

const StatCard = ({ title, value, icon: Icon, color = 'primary', trend, delay = 0 }) => {
  // Color mapping for 2D flat design
  const colorMap = {
    primary: {
      main: '#ec4899',
      light: '#f9a8d4',
      dark: '#db2777'
    },
    secondary: {
      main: '#0ea5e9',
      light: '#7dd3fc',
      dark: '#0284c7'
    },
    purple: {
      main: '#a855f7',
      light: '#c084fc',
      dark: '#9333ea'
    },
    orange: {
      main: '#f97316',
      light: '#fb923c',
      dark: '#ea580c'
    },
    pink: {
      main: '#ec4899',
      light: '#f9a8d4',
      dark: '#db2777'
    }
  }

  const selectedColor = colorMap[color] || colorMap.primary

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 overflow-hidden relative"
      style={{ boxShadow: 'none' }}
    >
      {/* 2D Top Border */}
      <div 
        className="h-1 mb-4 rounded-full" 
        style={{ backgroundColor: selectedColor.main }}
      ></div>
      
      {/* Decorative 2D shapes */}
      <div className="absolute top-2 right-2 opacity-10">
        <div 
          className="w-16 h-16 rounded-full" 
          style={{ backgroundColor: selectedColor.light }}
        ></div>
      </div>
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold mb-2">{value}</h3>
          {trend && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {trend.value} {trend.label}
            </p>
          )}
        </div>
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center" 
          style={{
            backgroundColor: selectedColor.main,
            boxShadow: 'none',
            transform: 'rotate(-5deg)'
          }}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

export default StatCard



















