import LegalLayout from './LegalLayout'

export default function Impressum() {
  return (
    <LegalLayout title="Impressum">
      <p className="text-gray-400">
        Platzhalter — bitte Angaben deines Unternehmens / deiner Person eintragen (Pflicht für kommerzielle Angebote in Deutschland).
      </p>
      <section className="space-y-2">
        <h2 className="text-white font-semibold">Angaben gemäß § 5 TMG</h2>
        <p>
          [Name / Firma]<br />
          [Straße Hausnummer]<br />
          [PLZ Ort]<br />
          Deutschland
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-white font-semibold">Kontakt</h2>
        <p>
          E-Mail: [E-Mail-Adresse]
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-white font-semibold">Hinweis</h2>
        <p className="text-gray-500">
          Diese Seite ist eine Vorlage und ersetzt keine Rechtsberatung. Bitte von einer Fachperson prüfen lassen.
        </p>
      </section>
    </LegalLayout>
  )
}
