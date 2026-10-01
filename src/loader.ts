const lines = [
  { prompt: '$ ', text: 'whoami' },
  { prompt: '> ', text: 'Jessica Gomez — Frontend Developer' },
  { prompt: '$ ', text: 'npm run build-portfolio' },
  { prompt: '> ', text: 'Compiling something reliable...' }
]

const MIN_DISPLAY_MS = 1400
const SAFETY_TIMEOUT_MS = 6000

let ready = false
let hidden = false
const startedAt = Date.now()

function hideLoader(loader: HTMLElement) {
  if (hidden) return
  hidden = true
  loader.classList.add('app-loader--hidden')
  window.setTimeout(() => loader.remove(), 500)
}

function tryHide(loader: HTMLElement) {
  if (!ready) return
  const elapsed = Date.now() - startedAt
  window.setTimeout(() => hideLoader(loader), Math.max(MIN_DISPLAY_MS - elapsed, 0))
}

export function markAppReady() {
  ready = true
  const loader = document.getElementById('app-loader')
  if (loader) tryHide(loader)
}

function typeLines(body: HTMLElement) {
  let lineIndex = 0
  let charIndex = 0
  let currentLineEl: HTMLDivElement | null = null

  function typeNext() {
    if (lineIndex >= lines.length) {
      const cursor = document.createElement('span')
      cursor.className = 'app-loader-cursor'
      currentLineEl?.appendChild(cursor)
      return
    }
    const line = lines[lineIndex]
    if (!currentLineEl || charIndex === 0) {
      currentLineEl = document.createElement('div')
      currentLineEl.className = 'app-loader-line'
      const promptEl = document.createElement('span')
      promptEl.className = 'app-loader-prompt'
      promptEl.textContent = line.prompt
      const textEl = document.createElement('span')
      textEl.className = 'app-loader-text'
      currentLineEl.append(promptEl, textEl)
      body.appendChild(currentLineEl)
    }
    const textEl = currentLineEl.querySelector('.app-loader-text')!
    if (charIndex < line.text.length) {
      textEl.textContent += line.text.charAt(charIndex)
      charIndex += 1
      window.setTimeout(typeNext, 28)
    } else {
      lineIndex += 1
      charIndex = 0
      window.setTimeout(typeNext, 220)
    }
  }

  typeNext()
}

export function initLoader() {
  const loader = document.getElementById('app-loader')
  const body = document.getElementById('app-loader-body')
  if (!loader || !body) return

  // Safety net in case the app never signals readiness.
  window.setTimeout(markAppReady, SAFETY_TIMEOUT_MS)

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion) {
    body.textContent = lines.map((l) => l.prompt + l.text).join('\n')
    return
  }

  typeLines(body)
}
