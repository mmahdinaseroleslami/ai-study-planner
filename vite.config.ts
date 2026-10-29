import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'http'

// Plugin سفارشی برای proxy API — فقط در dev فعال است
function apiProxyPlugin(): Plugin {
  return {
    name: 'api-proxy',
    configureServer(server) {
      server.middlewares.use('/api-proxy', (req: IncomingMessage, res: ServerResponse) => {
        const targetUrl = req.headers['x-target-url'] as string
        if (!targetUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'x-target-url header is required' }))
          return
        }

        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', async () => {
          try {
            const url = new URL(targetUrl)
            const headers: Record<string, string> = {
              'Content-Type': (req.headers['content-type'] as string) || 'application/json',
            }
            if (req.headers['authorization']) {
              headers['Authorization'] = req.headers['authorization'] as string
            }

            const response = await fetch(url.toString(), {
              method: req.method,
              headers,
              body: req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined,
            })

            res.writeHead(response.status, {
              'Content-Type': response.headers.get('content-type') || 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Target-URL',
            })

            const responseText = await response.text()
            res.end(responseText)
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Proxy error' }))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiProxyPlugin()],
  resolve: {
    alias: {
      '@': import.meta.dirname + '/src',
    },
  },
})
