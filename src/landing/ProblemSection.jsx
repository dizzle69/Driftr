import { Wind, HelpCircle, TrendingUp } from 'lucide-react'
import { AnimatedSection, StaggerChildren, StaggerItem } from './AnimatedSection'

const problems = [
  { icon: Wind, text: 'Was it headwind or are you just slow today?' },
  { icon: HelpCircle, text: 'Your best rides — what made them great?' },
  { icon: TrendingUp, text: 'Are you actually improving, or just picking easier routes?' },
]

export function ProblemSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <AnimatedSection>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-center">
            Strava tells you <span className="text-muted-foreground">WHAT</span> happened.{' '}
            <span className="gradient-text">Not WHY.</span>
          </h2>
        </AnimatedSection>

        <StaggerChildren className="mt-16 grid md:grid-cols-3 gap-6">
          {problems.map((item, i) => {
            const Icon = item.icon
            return (
              <StaggerItem key={i}>
                <div className="glass-card p-8 border-t-2 border-t-primary/40 hover:border-t-primary transition-colors group">
                  <Icon className="w-8 h-8 text-primary mb-4" strokeWidth={1.5} />
                  <p className="text-lg font-medium leading-snug text-foreground/90">{item.text}</p>
                </div>
              </StaggerItem>
            )
          })}
        </StaggerChildren>
      </div>
    </section>
  )
}
