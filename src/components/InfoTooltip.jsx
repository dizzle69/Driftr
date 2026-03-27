import { useState } from 'react'

export default function InfoTooltip({ text }) {
  const [visible, setVisible] = useState(false)

  return (
    <span
      className="relative inline-flex items-center ml-1.5"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className="text-gray-500 hover:text-gray-300 cursor-default text-xs leading-none select-none" aria-label={text}>
        ⓘ
      </span>
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-xs text-gray-300 shadow-lg z-50 pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-700" />
        </span>
      )}
    </span>
  )
}
