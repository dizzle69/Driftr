import { LandingNavbar } from './LandingNavbar'
import { HeroSection } from './HeroSection'
import { ProblemSection } from './ProblemSection'
import { FeaturesSection } from './FeaturesSection'
import { HowItWorksSection } from './HowItWorksSection'
import { TrustSection } from './TrustSection'
import { GetStartedSection } from './GetStartedSection'
import { FAQSection } from './FAQSection'
import { LandingFooter } from './LandingFooter'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <LandingNavbar />
      <main id="main-content">
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TrustSection />
        <GetStartedSection />
        <FAQSection />
      </main>
      <LandingFooter />
    </div>
  )
}
