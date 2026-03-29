import { Link } from 'react-router-dom'

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-10 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Driftr</p>
        <div className="flex flex-wrap justify-center gap-6">
          <Link to="/app" className="hover:text-foreground transition-colors">
            App
          </Link>
          <Link to="/impressum" className="hover:text-foreground transition-colors">
            Impressum
          </Link>
          <Link to="/datenschutz" className="hover:text-foreground transition-colors">
            Datenschutz
          </Link>
        </div>
      </div>
    </footer>
  )
}
