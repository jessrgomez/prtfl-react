import { useEffect, useRef, useState, type FormEvent } from 'react'

interface Message {
  role: 'bot' | 'user'
  text: string
}

interface KnowledgeEntry {
  id: string
  label: string
  content: string
}

const suggestions = ['Experience', 'Skills', 'Projects', 'Contact', 'CV']

// Empty in local dev (requests go through Vite's proxy to localhost:8787).
// Set at build time to the deployed backend's URL for a static production
// build (e.g. GitHub Pages), which has no dev proxy to rely on.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

// Broader synonym lists for the CMS-editable knowledge categories, so matching
// stays as forgiving as the original hardcoded bot. Entries added later through
// the CMS (with a generated id) fall back to matching on their label instead.
const knowledgeKeywords: Record<string, string[]> = {
  experience: ['experience', 'years', 'background', 'work history', 'career'],
  skills: ['skill', 'tech stack', 'technolog', 'stack', 'tools', 'language'],
  projects: ['project', 'portfolio', 'built', 'igaming', 'sapphire', 'atlas', 'aerovault'],
  education: ['education', 'school', 'degree', 'university', 'college', 'study'],
  contact: ['contact', 'email', 'hire', 'available', 'reach', 'get in touch'],
  location: ['location', 'based', 'where', 'philippines', 'remote']
}

function matchLiveKnowledge(text: string, entries: KnowledgeEntry[]): string | undefined {
  const normalized = text.toLowerCase()
  const match = entries.find((entry) => {
    const keywords = knowledgeKeywords[entry.id] ?? entry.label.toLowerCase().split(/\s+/)
    return keywords.some((keyword) => normalized.includes(keyword))
  })
  return match?.content
}

const knowledgeBase = [
  {
    keywords: ['experience', 'years', 'background', 'work history', 'career'],
    response:
      "Jessica has 8 years of professional experience as a Frontend Developer, building responsive and scalable web applications across the Aviation, Travel, Enterprise, and Gaming industries. She's currently a Frontend Developer at DigiPlus Interactive Corp., working on their iGaming platform (AP). Check the Career section for the full timeline."
  },
  {
    keywords: ['skill', 'tech stack', 'technolog', 'stack', 'tools', 'language'],
    response:
      "Jessica's core stack includes VueJS (Vue2 & Vue3), ReactJS, JavaScript (ES6+), TypeScript, TailwindCSS, and BootstrapVue on the frontend, with REST APIs, Pinia, TanStack Query, and NodeJS on the backend/integration side. She also works with Git, GitLab, Huawei Cloud, Figma, and AI-assisted tools like Claude AI and Cursor AI. See the Technical Skills section for the complete list."
  },
  {
    keywords: ['project', 'portfolio', 'built', 'igaming', 'sapphire', 'atlas', 'aerovault'],
    response:
      "Jessica has worked on projects like an iGaming Platform (AP v1, v2, Community, and Retail App) for DigiPlus, the Sapphire Portal and In-Flight Entertainment System, Atlas ERP System, and the Aerovault Tracking System for Global JD Holdings. Scroll down to the Projects section to see case studies and tech stacks for each."
  },
  {
    keywords: ['education', 'school', 'degree', 'university', 'college', 'study'],
    response:
      "Jessica holds a Bachelor of Science in Information Technology, majoring in Web Development, from Holy Angel University (2014–2018), where she was a Dean's Lister in 2018. She's also completed certifications in Data Privacy Compliance, AWS, and Advanced SEO."
  },
  {
    keywords: ['contact', 'email', 'hire', 'available', 'reach', 'get in touch'],
    response:
      "Jessica is open to new opportunities! You can reach her through the Contact form at the bottom of this page, or email her directly. Scroll down to the Contact section to send a message or copy her email."
  },
  {
    keywords: ['location', 'based', 'where', 'philippines', 'remote'],
    response: 'Jessica is based in Pampanga, Philippines (UTC+8) and is open to remote and on-site opportunities.'
  },
  {
    keywords: ['cv', 'resume', 'download'],
    response: 'You can download Jessica\'s CV using the "Download CV" button at the top of the page, right next to "View Projects" and "Get in Touch."'
  },
  {
    keywords: ['digiplus'],
    response:
      'At DigiPlus Interactive Corp., Jessica works on their iGaming platform (AP) — delivering frontend enhancements, the Loyalty Module, a third-party sportsbook API integration, the Community v2 social module, and the new AP Retail App built with Vue 3 and TypeScript.'
  },
  {
    keywords: ['global jd', 'aviation'],
    response:
      'At Global JD Holdings Inc., Jessica led frontend development and project coordination for the Sapphire Portal, Sapphire In-Flight Entertainment System, Atlas ERP System, and Aerovault Tracking System, serving aviation and transportation clients.'
  },
  {
    keywords: ['who are you', 'what are you', 'bot', 'chatbot'],
    response:
      "I'm a simple FAQ assistant built into this portfolio — I can answer common questions about Jessica's experience, skills, projects, her CV, and how to contact her."
  },
  {
    keywords: ['hi', 'hello', 'hey'],
    response: "Hello! Ask me about Jessica's experience, skills, projects, or how to get in touch."
  },
  {
    keywords: ['thank', 'thanks'],
    response: "You're welcome! Let me know if there's anything else you'd like to know."
  }
]

function findResponse(text: string) {
  const normalized = text.toLowerCase()
  const match = knowledgeBase.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword)))
  return match
    ? match.response
    : "I don't have a specific answer for that, but you can ask about Jessica's experience, skills, projects, her CV, or contact details — or reach her directly through the Contact section below."
}

async function fetchAiResponse(text: string, history: Message[]): Promise<string> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, history }),
    // Fall back to the offline knowledge match rather than leaving the user
    // waiting indefinitely if the AI service is slow or overloaded.
    signal: AbortSignal.timeout(8000)
  })

  if (!response.ok) {
    throw new Error(`Chat API responded with ${response.status}`)
  }

  const data = await response.json()
  if (typeof data.reply !== 'string') {
    throw new Error('Chat API returned an unexpected response')
  }
  return data.reply
}

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: "Hi! I'm Jessica's assistant. Ask me about her experience, skills, projects, her CV, or how to get in touch."
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [chipLabels, setChipLabels] = useState<string[]>(suggestions)
  const messagesEl = useRef<HTMLDivElement | null>(null)

  // Fetched fresh on every fallback (not cached in state) so a CMS edit made
  // after this page loaded is still picked up, instead of answering from a
  // stale snapshot taken when the chat widget first mounted.
  async function fetchLiveKnowledge(): Promise<KnowledgeEntry[]> {
    const res = await fetch(`${API_BASE}/api/knowledge`)
    if (!res.ok) throw new Error(`Knowledge API responded with ${res.status}`)
    return res.json()
  }

  // Re-pull the suggestion chips from the CMS every time the panel opens, so a
  // newly added entry (e.g. "Certifications") appears as a chip without a
  // page reload. Falls back to the static list on a static-only deployment.
  useEffect(() => {
    if (!isOpen) return
    fetchLiveKnowledge()
      .then((entries) => setChipLabels(entries.map((entry) => entry.label)))
      .catch(() => {})
  }, [isOpen])

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (messagesEl.current) {
        messagesEl.current.scrollTop = messagesEl.current.scrollHeight
      }
    })
  }

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const history = messages
    setMessages((msgs) => [...msgs, { role: 'user', text: trimmed }])
    setInputText('')
    setIsTyping(true)
    scrollToBottom()

    let reply: string
    try {
      reply = await fetchAiResponse(trimmed, history)
    } catch {
      const liveKnowledge = await fetchLiveKnowledge().catch(() => [])
      reply = matchLiveKnowledge(trimmed, liveKnowledge) ?? findResponse(trimmed)
    }

    setIsTyping(false)
    setMessages((msgs) => [...msgs, { role: 'bot', text: reply }])
    scrollToBottom()
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    sendMessage(inputText)
  }

  const toggleChat = () => {
    setIsOpen((open) => {
      const next = !open
      if (next) scrollToBottom()
      return next
    })
  }

  return (
    <div className="ai-chatbot">
      <button className="ai-chatbot-toggle" type="button" aria-expanded={isOpen} aria-controls="ai-chatbot-panel" onClick={toggleChat}>
        {!isOpen ? <span aria-hidden="true">💬</span> : <span aria-hidden="true">✕</span>}
        <span className="sr-only">{isOpen ? 'Close chat assistant' : 'Open chat assistant'}</span>
      </button>

      {isOpen && (
        <div id="ai-chatbot-panel" className="ai-chatbot-panel" role="dialog" aria-label="Portfolio chat assistant">
          <div className="ai-chatbot-header">
            <span>Ask about Jessica</span>
          </div>

          <div ref={messagesEl} className="ai-chatbot-messages">
            {messages.map((message, i) => (
              <div key={i} className={`ai-chatbot-message ai-chatbot-message--${message.role}`}>
                {message.text}
              </div>
            ))}
            {isTyping && (
              <div className="ai-chatbot-message ai-chatbot-message--bot ai-chatbot-typing" aria-live="polite">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>

          <div className="ai-chatbot-suggestions">
            {chipLabels.map((label) => (
              <button
                key={label}
                type="button"
                className="ai-chatbot-chip"
                disabled={isTyping}
                onClick={() => sendMessage(label)}
              >
                {label}
              </button>
            ))}
          </div>

          <form className="ai-chatbot-input-row" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="ai-chatbot-input">
              Ask a question
            </label>
            <input
              id="ai-chatbot-input"
              className="ai-chatbot-input"
              type="text"
              placeholder="Ask a question…"
              autoComplete="off"
              value={inputText}
              disabled={isTyping}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" className="ai-chatbot-send" aria-label="Send message" disabled={isTyping}>
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
