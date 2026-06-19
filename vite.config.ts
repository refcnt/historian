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
        server.middlewares.use((req, res, next) => {
          const urlPath = (req.url ?? '').split('?')[0]
          if (!urlPath.startsWith('/examples/')) return next()
          const filePath = resolve(__dirname, urlPath.slice(1))
          if (existsSync(filePath)) {
            const ext = filePath.split('.').pop() ?? ''
            const mime: Record<string, string> = {
              json: 'application/json',
              svg:  'image/svg+xml',
              png:  'image/png',
              jpg:  'image/jpeg',
              jpeg: 'image/jpeg',
            }
            res.setHeader('Content-Type', mime[ext] ?? 'application/octet-stream')
            res.setHeader('Cache-Control', 'no-cache')
            createReadStream(filePath).pipe(res as any)
            return
          }
          next()
        })
      },
    },
  ],
})
