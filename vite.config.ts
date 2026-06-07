import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createReadStream, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-data',
      configureServer(server) {
        const parentDir = __dirname
        const DATA_FILES = new Set(['world_110m.geojson', 'history_data.json'])
        server.middlewares.use((req, res, next) => {
          const urlPath = (req.url ?? '').split('?')[0].slice(1)
          if (DATA_FILES.has(urlPath)) {
            const filePath = resolve(parentDir, urlPath)
            if (existsSync(filePath)) {
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Cache-Control', 'max-age=3600')
              createReadStream(filePath).pipe(res as any)
              return
            }
          }
          next()
        })
      },
    },
  ],
})
