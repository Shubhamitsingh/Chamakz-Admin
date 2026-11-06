import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const firebaseConfigured = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID)

  return {
    plugins: [react()],
    resolve: firebaseConfigured
      ? {}
      : {
          alias: {
            'firebase/app': path.resolve(__dirname, 'src/firebase/shims/app.js'),
            'firebase/auth': path.resolve(__dirname, 'src/firebase/shims/auth.js'),
            'firebase/firestore': path.resolve(__dirname, 'src/firebase/shims/firestore.js'),
            'firebase/storage': path.resolve(__dirname, 'src/firebase/shims/storage.js'),
          },
        },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['framer-motion', 'lucide-react'],
            'chart-vendor': ['recharts'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  }
})
