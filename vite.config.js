import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',                      // you already set this
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',       // default entry
        notFound: '404.html',     // <- include 404.html in the build
      },
    },
  },
})
