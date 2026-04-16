import { useMemo, useState } from 'react'

const STORAGE_KEY = 'driftr_tester_access_ok'

export default function TesterAccessGate({ children }) {
  const accessCode = useMemo(
    () => (import.meta.env.VITE_TESTER_ACCESS_CODE || '').trim(),
    []
  )
  const gateEnabled = Boolean(accessCode)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [unlocked, setUnlocked] = useState(() => {
    if (!gateEnabled) return true
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  if (unlocked) return children

  function submit(e) {
    e.preventDefault()
    if (code.trim() === accessCode) {
      try {
        localStorage.setItem(STORAGE_KEY, 'true')
      } catch {
        // no-op
      }
      setUnlocked(true)
      return
    }
    setError('Incorrect tester code. Please try again.')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h1 className="text-xl font-semibold text-white">Private Tester Access</h1>
        <p className="text-sm text-gray-400 mt-2">
          This build is limited to invited testers. Enter your tester code to continue.
        </p>
        <form className="mt-5 space-y-3" onSubmit={submit}>
          <input
            type="password"
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              if (error) setError('')
            }}
            placeholder="Tester code"
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-strava"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            className="w-full px-3 py-2 rounded-lg bg-strava text-white font-medium hover:bg-orange-600 transition"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}
