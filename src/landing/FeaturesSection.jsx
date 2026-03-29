import { Wind, CloudSun, Clock, BarChart3, ShieldCheck } from 'lucide-react'
import { AnimatedSection, StaggerChildren, StaggerItem } from './AnimatedSection'

const features = [
  {
    icon: Wind,
    title: 'Wind impact',
    desc: 'Headwind, tailwind, and crosswind context per segment — when GPS supports it.',
  },
  {
    icon: CloudSun,
    title: 'Weather',
    desc: 'Temperature and conditions aligned with your ride — optional Open-Meteo enrichment.',
  },
  {
    icon: Clock,
    title: 'Time-of-day patterns',
    desc: 'When you ride most, and how timing lines up with performance.',
  },
  {
    icon: BarChart3,
    title: 'Trends & consistency',
    desc: 'Charts and summaries across your history — filters, fitness, and more.',
  },
  {
    icon: ShieldCheck,
    title: 'Local-first',
    desc: 'Your export is processed in the browser; nothing is uploaded to us by default.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <AnimatedSection>
          <div className="text-center">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              The extra layer on your data
            </h2>
          </div>
        </AnimatedSection>

        <StaggerChildren className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const FeatureIcon = f.icon
            return (
              <StaggerItem key={i} className={i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}>
                <div className="glass-card p-7 h-full hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <FeatureIcon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </StaggerItem>
            )
          })}
        </StaggerChildren>
      </div>
    </section>
  )
}
