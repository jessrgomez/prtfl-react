import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import { TYRES, type Compound, type Mood } from '../utils/pitWallCar'

// The card that opens when you right-click (or, on a touch screen, tap) the F1 Buddy, after Pit Wall's
// renderer/menu.html. The desktop-only parts (Claude, tasks, tickets, Lark) are left out.

export interface BuddyStatus {
  text: string
  dot: string
  driving: boolean
  racing: boolean
  driverOut: boolean
  tyre: Compound
}

export type BuddyAction = 'about' | 'download' | 'mood' | 'drive' | 'race' | 'driver' | 'pit' | 'exit'

interface Props {
  at: { x: number; y: number }
  status: BuddyStatus
  car: RefObject<HTMLElement | null>
  onAction: (name: BuddyAction, arg?: string) => void
  onClose: (refocus: boolean) => void
}

// Line icons from Pit Wall's renderer/icons.js.
const ICONS = {
  window: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  ),
  play: <polygon points="6 3 20 12 6 21 6 3" />,
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </>
  ),
  flag: (
    <>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </>
  ),
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  power: (
    <>
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </>
  )
} satisfies Record<string, ReactNode>

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg className="f1-menu-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}

const moods: [Mood, string, string][] = [
  ['smile', 'Smile', 'Max smiles'],
  ['angry', 'Angry', 'Max gets angry'],
  ['cry', 'Cry', 'Max cries']
]

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi))

export default function F1BuddyMenu({ at, status, car, onAction, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)

  // Opens just above the pointer, like the desktop card, kept inside the window. (Layout size, not
  // getBoundingClientRect: the card is still scaled down by its pop-in animation.)
  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return
    const width = card.offsetWidth
    const height = card.offsetHeight
    card.style.left = `${clamp(at.x - 30, 8, document.documentElement.clientWidth - width - 8)}px`
    card.style.top = `${clamp(at.y - height + 14, 8, window.innerHeight - height - 8)}px`
    card.querySelector('button')?.focus({ preventScroll: true })
  }, [at])

  useEffect(() => {
    // A press on the car is the car's to handle (a tap there toggles the menu).
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!cardRef.current?.contains(target) && !car.current?.contains(target)) onClose(false)
    }
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose(true)
    }
    const handleResize = () => onClose(false)
    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleKeydown)
    window.addEventListener('resize', handleResize)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('resize', handleResize)
    }
  }, [car, onClose])

  return (
    <div ref={cardRef} className="f1-menu" role="dialog" aria-label="F1 Buddy menu" onContextMenu={(e) => e.preventDefault()}>
      <div className="f1-menu-head">
        <div className="f1-menu-badge">3</div>
        <div>
          <div className="f1-menu-name">Pit Wall</div>
          <div className="f1-menu-status">
            <span className="f1-menu-dot" style={{ background: status.dot }}></span>
            {status.text}
          </div>
        </div>
      </div>

      <div className="f1-menu-label">PIT WALL</div>
      <button className="f1-menu-row" type="button" onClick={() => onAction('about')}>
        <Icon name="window" />
        <span className="f1-menu-t">What is Pit Wall?</span>
        <span className="f1-menu-note">Team radio explains</span>
      </button>
      <button className="f1-menu-row" type="button" onClick={() => onAction('download')}>
        <Icon name="download" />
        <span className="f1-menu-t">Download the app</span>
        <span className="f1-menu-note">Win, Mac, Ubuntu</span>
      </button>

      <div className="f1-menu-label">MAX</div>
      <div className="f1-menu-grid">
        {moods.map(([mood, label, title]) => (
          <button key={mood} className="f1-menu-tile" type="button" title={title} disabled={status.driverOut} onClick={() => onAction('mood', mood)}>
            {label}
          </button>
        ))}
      </div>

      <div className="f1-menu-label">CAR</div>
      <div className="f1-menu-grid">
        <button className="f1-menu-tile" type="button" title={status.driving ? 'Stop the car' : 'Send the car out'} onClick={() => onAction('drive')}>
          <Icon name={status.driving ? 'pause' : 'play'} />
          {status.driving ? 'Box, box' : 'Lights out'}
        </button>
        <button
          className={`f1-menu-tile ${status.racing ? 'on' : ''}`}
          type="button"
          title="Race McLaren #1, Mercedes #12 and Ferrari #44"
          onClick={() => onAction('race')}
        >
          <Icon name="flag" />
          {status.racing ? 'End race' : 'Race'}
        </button>
        <button
          className={`f1-menu-tile ${status.driverOut ? 'dim' : ''}`}
          type="button"
          title={status.driverOut ? 'Driver gets back in the car' : 'Driver gets out of the car'}
          onClick={() => onAction('driver')}
        >
          <Icon name="user" />
          {status.driverOut ? 'Driver in' : 'Driver out'}
        </button>
      </div>
      <div className="f1-menu-pit">
        <div className="f1-menu-t">
          Pit stop
          <div className="f1-menu-sub">On {status.tyre.toLowerCase()}s now</div>
        </div>
        {(Object.keys(TYRES) as Compound[]).map((compound) => (
          <button
            key={compound}
            className="f1-menu-tyre"
            type="button"
            style={{ borderColor: TYRES[compound] }}
            title={`${compound} tyres`}
            aria-label={`Pit stop for ${compound.toLowerCase()} tyres`}
            onClick={() => onAction('pit', compound)}
          >
            {compound[0]}
          </button>
        ))}
      </div>

      <div className="f1-menu-sep"></div>
      <button className="f1-menu-row exit" type="button" onClick={() => onAction('exit')}>
        <Icon name="power" />
        <span className="f1-menu-t">Back to the garage</span>
        <span className="f1-menu-note">Esc to close</span>
      </button>
    </div>
  )
}
