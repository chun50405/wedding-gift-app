import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// export default defineConfig({
//   plugins: [vue()],
// })
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://script.google.com/macros/s/AKfycbwrsz8T1TkPfaNqZi4rodQVcllOYJWI99UG03-45GW8bHOa5A0aHkUFtVgqdpkFyF2b/exec',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
