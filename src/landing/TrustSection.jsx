import { ShieldCheck, UserX, MonitorSmartphone, Quote } from 'lucide-react'
import { AnimatedSection, StaggerChildren, StaggerItem } from './AnimatedSection'

const testimonials = [
  {
    quote: 'Headwind context finally made my commute splits make sense.',
    name: 'Marco S.',
    detail: 'Hobby cyclist',
  },
  {
    quote: 'Tuesday rides vs temperature — I stopped blaming bad legs.',
    name: 'Lisa K.',
    detail: 'Road cyclist',
  },
  {
    quote: 'Local processing matters to me; Driftr fits the bill.',
    name: 'Thomas R.',
    detail: 'Gravel rider',
  },
]

const badges = [
  { icon: UserX, label: 'No account required' },
  { icon: ShieldCheck, label: 'Local-first' },
  { icon: MonitorSmartphone, label: 'Runs in your browser' },
]

export function TrustSection() {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <AnimatedSection>
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3 text-center">
            What riders say
          </p>
        </AnimatedSection>

        <StaggerChildren className="mt-8 grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <StaggerItem key={i}>
              <div className="glass-card p-7 h-full flex flex-col">
                <Quote className="w-5 h-5 text-primary/40 mb-3" />
                <p className="text-foreground/90 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 pt-4 border-t border-border">
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.detail}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        <AnimatedSection delay={0.3}>
          <div className="mt-16 flex flex-wrap justify-center gap-6 sm:gap-10">
            {badges.map((b, i) => {
              const Icon = b.icon
              return (
                <div key={i} className="flex items-center gap-2.5 text-muted-foreground">
                  <Icon className="w-5 h-5 text-primary/60" strokeWidth={1.5} />
                  <span className="text-sm font-medium">{b.label}</span>
                </div>
              )
            })}
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
