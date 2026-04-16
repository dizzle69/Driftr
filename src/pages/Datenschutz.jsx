import LegalLayout from './LegalLayout'

export default function Datenschutz() {
  return (
    <LegalLayout title="Privacy Policy">
      <p className="text-gray-400">
        Short template for the current architecture (local processing in the browser). Add your hosting provider, payment provider if applicable, and final domain — not legal advice.
      </p>

      <section className="space-y-2">
        <h2 className="text-white font-semibold">1. Data Controller</h2>
        <p>
          [Name / Company], [Address], [Email]
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-white font-semibold">2. Browser Processing (Local)</h2>
        <p>
          Activity data from your export is processed in your browser and stored in <strong>IndexedDB</strong> on your device. No full activity exports are sent to servers operated by us.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-white font-semibold">3. Open-Meteo (Weather)</h2>
        <p>
          If you enable weather enrichment, <strong>GPS start coordinates and date</strong> per activity are sent to the Open-Meteo Historical API. Details:{' '}
          <a href="https://open-meteo.com/en/terms" className="text-strava hover:underline" target="_blank" rel="noreferrer">
            open-meteo.com/en/terms
          </a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-white font-semibold">4. Nominatim (Location Names)</h2>
        <p>
          If you enable geocoding, start coordinates are sent to Nominatim (OpenStreetMap) to resolve a location name.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-white font-semibold">5. Map Tiles</h2>
        <p>
          If you enable map tiles, your browser loads map assets from third-party providers (for example CARTO); this can involve processing IP address and technical metadata.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-white font-semibold">6. AI Coach (Optional)</h2>
        <p>
          If you use the AI coach, enter an API key, and consent, your prompts and compressed training context are sent <strong>directly from your browser</strong> to your selected provider. API keys are not stored persistently by the app.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-white font-semibold">7. Hosting</h2>
        <p>
          The web app is delivered through a hosting provider (for example Netlify, Vercel, GitHub Pages). Server logs may include IP addresses — specify your provider and any required processing agreement details here.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-white font-semibold">8. Your Rights</h2>
        <p>
          You can delete stored data in the app via &quot;Reset&quot; and remove browser data / IndexedDB for this site. Additional GDPR rights (access, erasure, etc.) depend on the data controller and involved service providers.
        </p>
      </section>
    </LegalLayout>
  )
}
