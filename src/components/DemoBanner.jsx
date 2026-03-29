export default function DemoBanner({ onUploadOwn }) {
  return (
    <div className="bg-indigo-950/50 border border-indigo-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm mb-6">
      <p className="text-indigo-200">
        Du siehst <strong className="text-white">Demo-Daten</strong> (fiktiv). Lade deinen eigenen Export hoch, um echte Auswertungen zu sehen.
      </p>
      <button
        type="button"
        onClick={onUploadOwn}
        className="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
      >
        Eigenen Export laden
      </button>
    </div>
  )
}
