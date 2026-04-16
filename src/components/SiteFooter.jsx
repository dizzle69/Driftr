import { Link } from 'react-router-dom'
import EmailCapture from './EmailCapture'

export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-800 mt-12 py-8 px-6 text-xs text-gray-500">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 justify-center sm:justify-start">
          <Link to="/" className="hover:text-gray-300 transition">
            Home
          </Link>
          <Link to="/datenschutz" className="hover:text-gray-300 transition">
            Privacy
          </Link>
          <Link to="/impressum" className="hover:text-gray-300 transition">
            Imprint
          </Link>
          <span className="text-gray-600">© {new Date().getFullYear()} Driftr</span>
        </div>
        <EmailCapture />
      </div>
    </footer>
  )
}
