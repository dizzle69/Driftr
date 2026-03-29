import { useState } from 'react'

const ENDPOINT = (import.meta.env.VITE_FORM_ENDPOINT || '').trim()

function isAllowedFormEndpoint(url) {
  try {
    const u = new URL(url)
    if (u.protocol === 'https:') return true
    if (import.meta.env.DEV && u.protocol === 'http:' && u.hostname === 'localhost') return true
    return false
  } catch {
    return false
  }
}

const ENDPOINT_OK = ENDPOINT && isAllowedFormEndpoint(ENDPOINT)

if (import.meta.env.DEV && ENDPOINT && !ENDPOINT_OK) {
  console.warn(
    '[EmailCapture] VITE_FORM_ENDPOINT must be https:// (or http://localhost in dev). Form disabled.'
  )
}

/**
 * Optional waitlist / notify form. Set VITE_FORM_ENDPOINT to a Formspree (or similar) HTTPS URL.
 */
export default function EmailCapture() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | ok | err

  if (!ENDPOINT_OK) return null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: 'driftr-footer',
        }),
      })
      if (!res.ok) throw new Error('submit failed')
      setStatus('ok')
      setEmail('')
    } catch {
      setStatus('err')
    }
  }

  if (status === 'ok') {
    return (
      <p className="text-xs text-green-400 text-center sm:text-left">
        Danke — wir melden uns, sobald es Neuigkeiten gibt.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center max-w-md">
      <span className="text-xs text-gray-500 shrink-0">Updates:</span>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="E-Mail"
        required
        disabled={status === 'sending'}
        className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 text-xs placeholder-gray-600 focus:outline-none focus:border-strava"
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium border border-gray-700 transition disabled:opacity-50"
      >
        {status === 'sending' ? '…' : 'Eintragen'}
      </button>
      {status === 'err' && (
        <span className="text-xs text-red-400">Senden fehlgeschlagen.</span>
      )}
    </form>
  )
}
