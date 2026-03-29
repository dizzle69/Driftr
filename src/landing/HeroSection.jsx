import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

function WindVisualization() {
  return (
    <svg viewBox="0 0 500 400" className="w-full max-w-lg opacity-60" fill="none">
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <motion.path
          key={i}
          d={`M${-50 + i * 20},${80 + i * 40} Q${150 + i * 15},${50 + i * 30} ${300 + i * 10},${100 + i * 35} T550,${90 + i * 38}`}
          stroke="hsl(162 100% 48%)"
          strokeWidth={1.5 - i * 0.1}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.3 + i * 0.08 }}
          transition={{ duration: 2.5, delay: i * 0.2, ease: 'easeOut' }}
        />
      ))}
      {[40, 160, 300, 420].map((x, i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={120 + i * 50}
          r={3}
          fill="hsl(162 100% 48%)"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.5, delay: 1.5 + i * 0.15 }}
        />
      ))}
    </svg>
  )
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.05]">
              See what Strava{' '}
              <span className="gradient-text">doesn&apos;t show you.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Wind analysis, weather correlation, and performance context — from your export.
              Runs locally in your browser.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link to="/app" className="landing-btn-primary text-center" data-testid="cta-open-app">
                Open Driftr
              </Link>
              <a href="#how-it-works" className="landing-btn-outline text-center">
                See how it works
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No account · Optional weather/geocoding APIs · Works with a standard export
            </p>
          </motion.div>

          <motion.div
            className="hidden lg:flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div className="relative animate-float">
              <WindVisualization />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
