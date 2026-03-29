import LegalLayout from './LegalLayout'

export default function Datenschutz() {
  return (
    <LegalLayout title="Datenschutzerklärung">
      <p className="text-gray-400">
        Kurzfassung für die aktuelle Architektur (lokale Verarbeitung im Browser). Bitte Hosting-Anbieter, ggf. Zahlungsanbieter und finale Domain eintragen — keine Rechtsberatung.
      </p>

      <section className="space-y-2">
        <h2 className="text-white font-semibold">1. Verantwortlicher</h2>
        <p>
          [Name / Firma], [Adresse], [E-Mail]
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-white font-semibold">2. Verarbeitung im Browser (lokal)</h2>
        <p>
          Aktivitätsdaten aus deinem Export werden in deinem Browser verarbeitet und in <strong>IndexedDB</strong> auf deinem Gerät gespeichert. Es werden keine vollständigen Aktivitätsdaten an von uns betriebene Server übermittelt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-white font-semibold">3. Open-Meteo (Wetter)</h2>
        <p>
          Wenn du die Wetter-Anreicherung aktivierst, werden <strong>GPS-Startkoordinaten und Datum</strong> je Aktivität an die Open-Meteo Historical API übermittelt. Details:{' '}
          <a href="https://open-meteo.com/en/terms" className="text-strava hover:underline" target="_blank" rel="noreferrer">
            open-meteo.com/en/terms
          </a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-white font-semibold">4. Nominatim (Ortsnamen)</h2>
        <p>
          Wenn du die Geocodierung aktivierst, werden Startkoordinaten an Nominatim (OpenStreetMap) zur Auflösung eines Ortsnamens gesendet.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-white font-semibold">5. Kartenkacheln</h2>
        <p>
          Wenn du Kartenkacheln aktivierst, lädt dein Browser Kartenmaterial von Drittanbietern (z. B. CARTO); dabei können typischerweise IP-Adresse und technische Metadaten verarbeitet werden.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-white font-semibold">6. KI-Coach (optional)</h2>
        <p>
          Wenn du den KI-Coach nutzt, einen API-Schlüssel eingibst und zustimmst, werden deine Fragen und ein komprimierter Trainingskontext <strong>direkt von deinem Browser</strong> an den von dir gewählten Anbieter gesendet. API-Schlüssel werden in der App nicht dauerhaft gespeichert.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-white font-semibold">7. Hosting</h2>
        <p>
          Die Auslieferung der Web-App erfolgt über einen Hosting-Anbieter (z. B. Netlify, Vercel, GitHub Pages). Dabei können Server-Logs mit IP-Adresse entstehen — bitte Anbieter und ggf. Auftragsverarbeitungsvertrag in dieser Sektion konkretisieren.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-white font-semibold">8. Deine Rechte</h2>
        <p>
          Du kannst gespeicherte Daten in der App über &quot;Reset&quot; löschen sowie Browser-Daten / IndexedDB für diese Seite entfernen. Weitere Rechte nach DSGVO (Auskunft, Löschung, etc.) richten sich nach dem Verantwortlichen und den beteiligten Dienstleistern.
        </p>
      </section>
    </LegalLayout>
  )
}
