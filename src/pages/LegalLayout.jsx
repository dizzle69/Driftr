import { Link } from 'react-router-dom'

export default function LegalLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="text-strava font-bold text-lg hover:opacity-90 transition">
            Driftr
          </Link>
          <Link to="/app" className="text-sm text-gray-400 hover:text-white transition">
            ← Zum Dashboard
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 text-sm text-gray-300 space-y-4">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {children}
      </main>
      <footer className="border-t border-gray-800 py-6 text-center text-xs text-gray-600">
        <Link to="/" className="hover:text-gray-400">Start</Link>
        {' · '}
        <Link to="/datenschutz" className="hover:text-gray-400">Datenschutz</Link>
        {' · '}
        <Link to="/impressum" className="hover:text-gray-400">Impressum</Link>
      </footer>
    </div>
  )
}
