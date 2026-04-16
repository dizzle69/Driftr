import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AnimatedSection } from './AnimatedSection'

const bullets = [
  'Import your export ZIP or try built-in demo data',
  'IndexedDB storage on your device — reset anytime',
  'Optional Open-Meteo & Nominatim (your choice)',
  'AI coach: bring your own API key, calls from the browser',
  'Imprint & Privacy pages linked in the app footer',
]

export function GetStartedSection() {
  return (
    <section id="get-started" className="py-24 sm:py-32">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <AnimatedSection>
          <div className="glass-card p-10 sm:p-12 border-primary/20 teal-glow text-center">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-6">
              Get started
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Run it locally
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              No paywall in the open-source-style path — open the app and go.
            </p>

            <ul className="mt-8 space-y-3 text-left max-w-sm mx-auto">
              {bullets.map((line, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                  {line}
                </li>
              ))}
            </ul>

            <Link to="/app" className="mt-10 w-full landing-btn-primary block text-center">
              Open Driftr
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              You can add Stripe checkout or a license layer later without changing this flow.
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
