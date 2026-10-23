import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { onRequestGet as configGet } from '../functions/api/config.js'
import {
  onRequestOptions as lunaOptions,
  onRequestPost as lunaPost,
} from '../functions/api/luna-chat.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const PRIMARY_BUILD_DIR = path.resolve(ROOT_DIR, 'build')
const SNAPSHOT_FALLBACK_DIR = path.resolve(ROOT_DIR, '.preview-static')
const PORT = Number(process.env.PORT || 3000)
const HOST = process.env.HOST || '0.0.0.0'

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

let buildInProgress = false
let lastBuildError = null

const getActiveStaticDir = () => {
  if (fs.existsSync(path.join(PRIMARY_BUILD_DIR, 'index.html'))) {
    return PRIMARY_BUILD_DIR
  }
  if (fs.existsSync(path.join(SNAPSHOT_FALLBACK_DIR, 'index.html'))) {
    return SNAPSHOT_FALLBACK_DIR
  }
  return null
}

const syncSnapshotFallback = () => {
  try {
    if (!fs.existsSync(path.join(PRIMARY_BUILD_DIR, 'index.html'))) return
    fs.rmSync(SNAPSHOT_FALLBACK_DIR, { recursive: true, force: true })
    fs.cpSync(PRIMARY_BUILD_DIR, SNAPSHOT_FALLBACK_DIR, { recursive: true })
  } catch (err) {
    console.warn('[preview-server] Snapshot fallback sync warning:', err.message)
  }
}

const ensureProductionBuild = () => {
  if (fs.existsSync(path.join(PRIMARY_BUILD_DIR, 'index.html')) || buildInProgress) return
  buildInProgress = true
  lastBuildError = null
  console.log('[preview-server] build/index.html missing — running automatic build recovery...')

  const child = spawn(
    '/bin/bash',
    [
      '-lc',
      '(test -x node_modules/.bin/react-scripts || npm ci --no-audit --no-fund) && GENERATE_SOURCEMAP=false npm run build',
    ],
    {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      env: process.env,
    }
  )

  child.on('exit', (code) => {
    buildInProgress = false
    if (code !== 0) {
      lastBuildError = `Build exited with code ${code}`
      console.error(`[preview-server] Automatic build failed (${code})`)
    } else {
      syncSnapshotFallback()
      console.log('[preview-server] Automatic build completed cleanly.')
    }
  })

  child.on('error', (err) => {
    buildInProgress = false
    lastBuildError = err.message
    console.error('[preview-server] Build process spawn error:', err)
  })
}

const pipeFileSafely = (filePath, res, contentType, extraHeaders = {}) => {
  const stream = fs.createReadStream(filePath)
  stream.on('open', () => {
    res.statusCode = 200
    res.setHeader('Content-Type', contentType)
    Object.entries(extraHeaders).forEach(([k, v]) => res.setHeader(k, v))
    stream.pipe(res)
  })
  stream.on('error', (err) => {
    if (!res.headersSent) {
      res.statusCode = err.code === 'ENOENT' ? 503 : 500
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end('Preview asset temporarily unavailable.')
    } else {
      res.destroy()
    }
  })
}

const sendWebResponse = async (res, webRes) => {
  res.statusCode = webRes.status
  webRes.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  const buffer = Buffer.from(await webRes.arrayBuffer())
  res.end(buffer)
}

const server = http.createServer(async (req, res) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const host = req.headers.host || `127.0.0.1:${PORT}`
    const fullUrl = new URL(req.url || '/', `${protocol}://${host}`)

    if (fullUrl.pathname === '/api/config' && req.method === 'GET') {
      const webReq = new Request(fullUrl.toString(), { method: req.method, headers: req.headers })
      const webRes = await configGet({ request: webReq, env: process.env })
      await sendWebResponse(res, webRes)
      return
    }

    if (fullUrl.pathname === '/api/luna-chat') {
      if (req.method === 'OPTIONS') {
        const webReq = new Request(fullUrl.toString(), { method: 'OPTIONS', headers: req.headers })
        const webRes = await lunaOptions({ request: webReq, env: process.env })
        await sendWebResponse(res, webRes)
        return
      }
      if (req.method === 'POST') {
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const bodyBuffer = Buffer.concat(chunks)
        const webReq = new Request(fullUrl.toString(), {
          method: 'POST',
          headers: req.headers,
          body: bodyBuffer,
        })
        const webRes = await lunaPost({ request: webReq, env: process.env })
        await sendWebResponse(res, webRes)
        return
      }
    }

    const staticDir = getActiveStaticDir()
    if (!fs.existsSync(path.join(PRIMARY_BUILD_DIR, 'index.html'))) {
      ensureProductionBuild()
    }

    if (!staticDir) {
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="refresh" content="3" />
    <title>HerCycle — Preparing Preview</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #faf7f4; color: #5b3f50; font-family: Georgia, serif; text-align: center; padding: 24px; }
      .card { max-width: 420px; padding: 28px; border-radius: 22px; background: #fffdfc; border: 1px solid #eadfe7; box-shadow: 0 14px 40px rgba(72,49,68,0.08); }
      p { color: #837380; font-family: system-ui, sans-serif; font-size: 0.9rem; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>HerCycle</h1>
      <p>${lastBuildError ? `Preview recovery error: ${lastBuildError}` : 'Preparing your sanctuary preview — refreshing automatically in a moment…'}</p>
    </div>
  </body>
</html>`)
      return
    }

    const decodedPath = decodeURIComponent(fullUrl.pathname)
    const safeRelative = decodedPath.replace(/^\/+/, '')
    const candidate = path.resolve(staticDir, safeRelative)

    if (
      candidate.startsWith(staticDir) &&
      fs.existsSync(candidate) &&
      fs.statSync(candidate).isFile()
    ) {
      const ext = path.extname(candidate).toLowerCase()
      pipeFileSafely(candidate, res, MIME_TYPES[ext] || 'application/octet-stream')
      return
    }

    pipeFileSafely(path.join(staticDir, 'index.html'), res, 'text/html; charset=utf-8', {
      'Cache-Control': 'no-cache',
    })
  } catch (error) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: error.message || 'Internal preview server error' }))
  }
})

syncSnapshotFallback()
ensureProductionBuild()

server.listen(PORT, HOST, () => {
  console.log(`HerCycle Cloudflare Pages preview listening on http://${HOST}:${PORT}`)
})
