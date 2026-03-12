// Web Worker: parses GPX/FIT files off the main thread
// Usage: new Worker(new URL('./workers/parseWorker.js', import.meta.url), { type: 'module' })
//
// Message in:  { id: string, filename: string, content: string|ArrayBuffer }
// Message out: { id: string, result: { points, startLat, startLon } } | { id: string, error: string }

import { parseActivityFile } from '../utils/parseStrava'

self.onmessage = async ({ data }) => {
  const { id, filename, content } = data
  try {
    const result = await parseActivityFile(filename, content)
    self.postMessage({ id, result })
  } catch (err) {
    self.postMessage({ id, error: err.message })
  }
}
