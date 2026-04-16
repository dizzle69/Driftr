import { useState, useRef, useEffect } from 'react'
import { buildCoachContext } from '../utils/buildCoachContext'

const PROVIDERS = [
  { value: 'claude', label: 'Claude (Anthropic)' },
  { value: 'openai', label: 'OpenAI' },
]

const MODELS = {
  claude: [
    { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (recommended)' },
    { value: 'claude-opus-4-6',   label: 'Claude Opus 4.6 (powerful)' },
  ],
  openai: [
    { value: 'gpt-4o',      label: 'GPT-4o (recommended)' },
    { value: 'gpt-4o-mini', label: 'GPT-4o mini (faster)' },
  ],
}

const SYSTEM_PROMPT = `You are an experienced cycling coach. Analyze Strava training data and provide concise, data-driven answers in English. Be specific, reference numbers from the data, and give practical recommendations. Keep responses to a maximum of 5 sentences unless the user asks for a deeper analysis.`

/** Never surface API key-like substrings from provider errors to the UI (XSS / shoulder-surfing). */
function safeCoachError(e) {
  const m = e?.message || 'Unknown error'
  if (/sk-[a-zA-Z0-9_-]{10,}/i.test(m) || /Bearer\s+\S+/i.test(m)) {
    return 'API error — details were hidden for security reasons.'
  }
  return m
}

async function callClaude(apiKey, model, messages, context) {
  const systemWithContext = `${SYSTEM_PROMPT}\n\nCurrent training context:\n${context}`
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 900,
      system: systemWithContext,
      messages,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

async function callOpenAI(apiKey, model, messages, context) {
  const systemMsg = { role: 'system', content: `${SYSTEM_PROMPT}\n\nCurrent training context:\n${context}` }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 900,
      messages: [systemMsg, ...messages],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

export default function AiCoach({ activities }) {
  const [open, setOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [provider, setProvider] = useState(() => localStorage.getItem('coach_provider') || 'claude')
  const [model, setModel] = useState(() => localStorage.getItem('coach_model') || 'claude-sonnet-4-6')
  // Never persist the API key (reduces risk of accidental exfiltration via XSS/localStorage).
  const [apiKey, setApiKey] = useState('')
  const [aiConsent, setAiConsent] = useState(() => localStorage.getItem('coach_ai_consent') === 'true')
  const [messages, setMessages] = useState([]) // { role: 'user'|'assistant', content: string }
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  // Sync model default when provider changes
  function handleProviderChange(p) {
    setProvider(p)
    localStorage.setItem('coach_provider', p)
    const defaultModel = MODELS[p][0].value
    setModel(defaultModel)
    localStorage.setItem('coach_model', defaultModel)
  }

  function handleModelChange(m) {
    setModel(m)
    localStorage.setItem('coach_model', m)
  }

  function handleKeyChange(k) {
    setApiKey(k)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    if (!apiKey) { setError('Please enter an API key.'); setShowSettings(true); return }
    if (!aiConsent) {
      setError('Please confirm consent to send training data to the selected AI provider.')
      setShowSettings(true)
      return
    }

    const context = buildCoachContext(activities)
    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      // Only send last 10 messages to keep context manageable
      const apiMessages = newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      let reply
      if (provider === 'claude') {
        reply = await callClaude(apiKey, model, apiMessages, context)
      } else {
        reply = await callOpenAI(apiKey, model, apiMessages, context)
      }
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      setError(safeCoachError(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-strava text-white shadow-lg flex items-center justify-center text-2xl hover:bg-orange-600 transition"
        title="AI Training Coach"
      >
        🤖
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-h-[80vh] flex flex-col rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="font-semibold text-gray-100">AI Training Coach</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(s => !s)}
                className="text-gray-400 hover:text-white text-lg transition"
                title="Settings"
              >⚙</button>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white text-xl leading-none transition"
              >×</button>
            </div>
          </div>

          {/* Settings panel */}
          {showSettings && (
            <div className="px-4 py-3 border-b border-gray-800 space-y-2 bg-gray-950">
              <div className="flex gap-2">
                {PROVIDERS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => handleProviderChange(p.value)}
                    className={`flex-1 px-2 py-1 text-xs rounded-lg transition ${
                      provider === p.value ? 'bg-strava text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >{p.label}</button>
                ))}
              </div>
              <select
                value={model}
                onChange={e => handleModelChange(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:border-strava focus:outline-none"
              >
                {MODELS[provider].map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <input
                type="password"
                placeholder="Enter API key…"
                value={apiKey}
                onChange={e => handleKeyChange(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:border-strava focus:outline-none"
              />
              <label className="flex items-start gap-2 text-gray-400 text-xs">
                <input
                  type="checkbox"
                  checked={aiConsent}
                  onChange={e => {
                    const v = e.target.checked
                    setAiConsent(v)
                    localStorage.setItem('coach_ai_consent', v ? 'true' : 'false')
                  }}
                  className="mt-0.5"
                />
                I agree that training data can be sent to the selected AI provider.
              </label>
              <p className="text-gray-600 text-xs">
                The API key is not stored persistently (only in the current browser tab).
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.length === 0 && (
              <p className="text-gray-500 text-sm text-center mt-4">
                Ask a question about your training,
                <br />
                for example: “How did my training look this month?”
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-strava text-white'
                      : 'bg-gray-800 text-gray-200'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-400 rounded-xl px-3 py-2 text-sm">
                  <span className="animate-pulse">Thinking…</span>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-900/40 border border-red-800 text-red-300 rounded-xl px-3 py-2 text-xs">
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask a question…"
              className="flex-1 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-xl px-3 py-2 focus:border-strava focus:outline-none"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="px-3 py-2 bg-strava text-white rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-40 transition"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  )
}
