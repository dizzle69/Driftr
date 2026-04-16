import LegalLayout from './LegalLayout'

export default function Impressum() {
  return (
    <LegalLayout title="Imprint">
      <p className="text-gray-400">
        Template placeholder — fill in your company or personal legal details (required for commercial offerings in Germany).
      </p>
      <section className="space-y-2">
        <h2 className="text-white font-semibold">Information according to Section 5 TMG</h2>
        <p>
          [Name / Company]<br />
          [Street Address]<br />
          [Postal Code, City]<br />
          Deutschland
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-white font-semibold">Contact</h2>
        <p>
          Email: [Email Address]
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-white font-semibold">Notice</h2>
        <p className="text-gray-500">
          This page is a template and does not constitute legal advice. Please have it reviewed by a qualified professional.
        </p>
      </section>
    </LegalLayout>
  )
}
