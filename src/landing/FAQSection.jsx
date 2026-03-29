import { AnimatedSection } from './AnimatedSection'

const faqs = [
  {
    q: 'Is my data safe?',
    a: 'Processing runs in your browser. Your export is not sent to our servers by default. Optional features (weather, geocoding, map tiles, AI coach) call third parties only when you enable them.',
  },
  {
    q: 'Do I need Strava Summit?',
    a: 'No. The standard bulk export (ZIP) is enough for Driftr.',
  },
  {
    q: 'Browsers & devices?',
    a: 'Use a modern desktop browser for best results (Chrome, Firefox, Safari, Edge). Large heatmaps and maps want screen space.',
  },
  {
    q: 'How big can my export be?',
    a: 'The app parses in-browser; very large exports may be slower or memory-heavy depending on your device.',
  },
  {
    q: 'Is Driftr affiliated with Strava?',
    a: 'No. Driftr is independent. Strava is a trademark of its owner.',
  },
]

export function FAQSection() {
  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <AnimatedSection>
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Common questions</h2>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="glass-card px-6 border border-border rounded-lg group open:border-primary/25"
              >
                <summary className="font-semibold py-5 cursor-pointer list-none flex items-center justify-between gap-4 text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="text-primary text-lg leading-none shrink-0 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="text-muted-foreground leading-relaxed pb-5 -mt-1">{faq.a}</p>
              </details>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
