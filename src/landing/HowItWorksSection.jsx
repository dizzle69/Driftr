import { Download, Upload, Zap } from 'lucide-react'
import { AnimatedSection, StaggerChildren, StaggerItem } from './AnimatedSection'

const steps = [
  {
    icon: Download,
    num: '01',
    title: 'Export from Strava',
    desc: 'Request your data export in Strava settings. You get a ZIP with activities and files.',
    link: {
      text: 'Strava export instructions →',
      href: 'https://support.strava.com/hc/en-us/articles/216918437-Exporting-your-Data-and-Bulk-Export',
    },
  },
  {
    icon: Upload,
    num: '02',
    title: 'Open it in Driftr',
    desc: 'Drop the ZIP in the app (or try demo data). Parsing runs locally in your browser.',
  },
  {
    icon: Zap,
    num: '03',
    title: 'Explore insights',
    desc: 'Wind, weather, heatmaps, AI coach — enable optional API calls only if you want.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <AnimatedSection>
          <div className="text-center">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Three steps. That&apos;s it.
            </h2>
          </div>
        </AnimatedSection>

        <StaggerChildren className="mt-16 space-y-0">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <StaggerItem key={i}>
                <div className="relative flex gap-6 sm:gap-8 pb-12 last:pb-0">
                  {i < steps.length - 1 && (
                    <div className="absolute left-[23px] sm:left-[27px] top-14 bottom-0 w-px bg-border" aria-hidden />
                  )}
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-primary/40 bg-background flex items-center justify-center relative z-10">
                    <span className="text-sm font-bold text-primary font-mono">{step.num}</span>
                  </div>
                  <div className="pt-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-primary shrink-0" strokeWidth={1.5} />
                      <h3 className="text-xl font-bold">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                    {step.link && (
                      <a
                        href={step.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-sm text-primary hover:underline"
                      >
                        {step.link.text}
                      </a>
                    )}
                  </div>
                </div>
              </StaggerItem>
            )
          })}
        </StaggerChildren>
      </div>
    </section>
  )
}
