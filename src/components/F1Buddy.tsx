import { useCallback, useEffect, useRef, useState } from 'react'
import { getF1Buddy, useF1Buddy } from '../composables/useF1Buddy'
import { scrollToSection } from '../utils/scroll'
import F1BuddyMenu, { type BuddyAction, type BuddyStatus } from './F1BuddyMenu'
import { LIVERIES, TYRES, applyCarFrame, bindCar, carSvg, type Compound, type EmoteFrame, type Mood } from '../utils/pitWallCar'

// The Pit Wall desktop car as a buddy for the page: it drops out of the nav button, lands on the bottom
// of the window and drives back and forth. Hover for team radio, click for a pit stop, drag to pick it
// up and throw it, right-click for the menu: moods, Race mode, the driver getting out. On a touch screen
// a tap opens the menu instead, as there is no right-click (the pit stop is in the menu).
// The motion comes from the desktop app (ubuntu/main/car.js), whose numbers are per 33 ms tick at a
// 300 px car, so each frame advances by however many ticks have passed, scaled to this car's size.

const TICK = 33
const GRAVITY = 1.8
const EMOTE_SIZE = 1.35
const DRIVER_FROM = { x: -206, y: -4 }
const LAPS = 4
// Rival cars for Race mode, in the lanes behind yours. Back row first, so nearer cars draw in front.
const RIVALS = [
  { id: 'pw-ferrari', livery: LIVERIES.ferrari, lane: 78 },
  { id: 'pw-mercedes', livery: LIVERIES.mercedes, lane: 52 },
  { id: 'pw-mclaren', livery: LIVERIES.mclaren, lane: 26 }
]
type Mode = 'air' | 'drive' | 'park' | 'pit' | 'drag'

const RADIO_LINES = [
  'Box, box. Box, box.', 'Mode push. Push now!', 'Copy, copy.', 'Simply lovely!', 'Purple sector!',
  'DRS enabled. Go, go, go!', 'Tyres are in the window. Keep pushing.', 'Stay out, stay out.', 'Plan A. Plan A.',
  "Let's go, let's go!", 'Get in there!', 'Fastest lap. Beautiful.', 'Click me to box, drag me to fly, right-click for the menu.',
  "I'm Pit Wall, Jessica's desktop race engineer. I radio her when tasks are due.",
  'On the desktop I run on PowerShell and WPF, or Electron on Ubuntu.'
]
const DRIVER_OUT_LINES = ['Stretching my legs.', 'Car is parked. Grab some water.', 'Back in a minute. Coffee first.',
  'Taking a breather. You should too.', 'Tyres cooling, so am I.']
const GRAB_LINES = ['Whoa! Easy on the car!', 'Put me down, mate!', "That's not how pit stops work!"]
const LANDING_LINES = ['Simply lovely!', 'Stuck the landing!', 'All four wheels on track. Copy.']
const BYE_LINES = ['Back to the garage. See you next race!', 'Box this lap. The car is going to the garage.']
const ABOUT_LINE = "I'm Pit Wall: an F1 race engineer on Jessica's desktop. I track her tasks, tickets and meetings, and radio “Box, box!” when something's due."

const rand = (n: number) => Math.floor(Math.random() * n)
const pick = <T,>(list: T[]) => list[rand(list.length)]
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)
const wave = (k: number, step: number, rate: number, phase = 0) => [0, 1, 2].map((i) => 0.35 + 0.65 * Math.abs(Math.sin((k + i * step + phase) * rate)))

interface PitStop {
  phase: 'in' | 'work' | 'out'
  t: number
  compound: Compound
  swapped: boolean
}

interface Emote {
  mood: Mood
  t: number
  until: number
  out: number
}

interface Drag {
  id: number
  ox: number
  oy: number
  sx: number
  sy: number
  moved: number
  lx: number
  ly: number
  lt: number
  vx: number
  vy: number
}

interface RaceCar {
  x: number
  dir: number
  v: number
  target: number
  retarget: number
  lap: number
  dist: number
}

interface Menu {
  at: { x: number; y: number }
  status: BuddyStatus
}

export default function F1Buddy() {
  const { active, park } = useF1Buddy()
  const [shown, setShown] = useState(false)
  const [menu, setMenu] = useState<Menu | null>(null)
  const menuOpenRef = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const carRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const tailRef = useRef<HTMLDivElement>(null)
  const rivalRefs = useRef<(HTMLDivElement | null)[]>([])
  const actRef = useRef<((name: BuddyAction, arg?: string) => void) | null>(null)

  // Switched off, the car stays on screen until it has driven away (then sets shown back to false).
  if (active && !shown) setShown(true)

  useEffect(() => {
    menuOpenRef.current = menu !== null
  }, [menu])

  const closeMenu = useCallback((refocus: boolean) => {
    setMenu(null)
    if (refocus) carRef.current?.focus({ preventScroll: true })
  }, [])

  const runMenuAction = (name: BuddyAction, arg?: string) => {
    closeMenu(true)
    if (name === 'exit') park()
    else if (name === 'download') scrollToSection('pit-wall')
    else actRef.current?.(name, arg)
  }

  useEffect(() => {
    const root = rootRef.current
    const box = carRef.current
    const bubble = bubbleRef.current
    const text = textRef.current
    const tail = tailRef.current
    const rivalEls = rivalRefs.current.slice(0, RIVALS.length)
    if (!shown || !root || !box || !bubble || !text || !tail || rivalEls.length < RIVALS.length || rivalEls.some((el) => !el)) return

    box.innerHTML = carSvg()
    const car = bindCar(box)
    const rivals = RIVALS.map((spec, i) => {
      const el = rivalEls[i] as HTMLDivElement
      el.innerHTML = carSvg(spec.livery, spec.id)
      return { el, car: bindCar(el, spec.id), lane: spec.lane, x: 0, dir: -1, v: 0, target: 0, retarget: 0, lap: 0, dist: 0, angle: 0, bob: 0, lines: [0, 0, 0], phase: rand(100) / 10 }
    })
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const touch = window.matchMedia('(hover: none)').matches
    const menuVerb = touch ? 'Tap' : 'Right-click'
    const viewWidth = () => document.documentElement.clientWidth
    const viewHeight = () => window.innerHeight

    let w = 0
    let h = 0
    let scale = 1
    let speed = 0
    let bubbleHalf = 0
    const resize = () => {
      w = viewWidth() <= 768 ? 170 : 240
      h = (w * 108) / 400
      scale = w / 300
      speed = 3 * scale // the desktop car does 3 px a tick
      for (const el of [root, ...rivals.map((r) => r.el)]) {
        el.style.width = `${w}px`
        el.style.height = `${h}px`
      }
      bubbleHalf = bubble.offsetWidth / 2
    }
    resize()

    // x is the left edge, up the height above the bottom of the window.
    const from = getF1Buddy().from ?? { x: viewWidth() - 120, y: 64 }
    const s = {
      x: clamp(from.x - w / 2, 0, Math.max(0, viewWidth() - w)),
      up: reduced ? 0 : Math.max(0, viewHeight() - from.y - h * 0.6),
      vx: 0,
      vup: reduced ? 0 : 7,
      dir: from.x > viewWidth() / 2 ? -1 : 1,
      mode: (reduced ? 'park' : 'air') as Mode,
      parked: reduced,
      v: 0,
      target: 0,
      retarget: 0,
      lap: 0,
      dist: 0,
      k: 0,
      angle: 0,
      spin: 0,
      bob: 0,
      lines: [0, 0, 0],
      tilt: 0,
      pop: reduced ? 1 : 0,
      squash: 0,
      tyre: 'Medium' as Compound,
      pit: null as PitStop | null,
      crewX: 150,
      gun: 1,
      helmet: true,
      driverOut: false,
      driverAnim: null as { dir: 'in' | 'out'; t: number } | null,
      driver: { x: 0, y: 0, wave: 0 },
      emote: null as Emote | null,
      emoteFrame: null as EmoteFrame | null,
      bubbleUntil: 0,
      bubbleKind: '',
      lastLine: -1,
      nextChat: reduced ? 6000 / TICK : Infinity,
      hinted: false,
      landed: reduced,
      leaving: false
    }
    const race = { on: false, finished: false, restartAt: 0, position: 0, check: 0 }
    let drag: Drag | null = null
    let menuWasOpen = false
    let touchTap = false
    let done = false
    let raf = 0

    // ---------- Radio bubble ----------
    const say = (line: string, seconds: number, kind = 'radio') => {
      text.textContent = line
      bubble.classList.add('show')
      bubbleHalf = bubble.offsetWidth / 2
      s.bubbleUntil = performance.now() + seconds * 1000
      s.bubbleKind = kind
    }
    const hush = () => {
      bubble.classList.remove('show')
      s.bubbleKind = ''
    }
    const radioLine = () => {
      if (s.driverOut) return pick(DRIVER_OUT_LINES)
      let i = rand(RADIO_LINES.length)
      while (i === s.lastLine) i = rand(RADIO_LINES.length)
      s.lastLine = i
      return RADIO_LINES[i]
    }

    // Radio beep, as the desktop car does for friendly calls.
    let audio: AudioContext | null = null
    const beep = () => {
      try {
        audio = audio || new AudioContext()
        for (const [i, hz] of [660, 990].entries()) {
          const o = audio.createOscillator()
          const g = audio.createGain()
          const t = audio.currentTime + i * 0.13
          o.type = 'sine'
          o.frequency.value = hz
          g.gain.setValueAtTime(0.0001, t)
          g.gain.exponentialRampToValueAtTime(0.08, t + 0.02)
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
          o.connect(g).connect(audio.destination)
          o.start(t)
          o.stop(t + 0.13)
        }
      } catch {
        // no audio available
      }
    }

    // ---------- Max's moods ----------
    const showEmote = (mood: Mood, seconds: number) => {
      if (s.driverOut || s.driverAnim) return
      s.emote = { mood, t: 0, until: performance.now() + seconds * 1000, out: 0 }
    }
    // Max reacts by himself now and then (not every time, so it stays fun).
    const invokeMood = (mood: Mood, chance: number) => {
      if (!s.emote && rand(100) < chance) showEmote(mood, 4)
    }
    const stepEmote = (dt: number, now: number) => {
      const e = s.emote
      if (!e) {
        s.emoteFrame = null
        return
      }
      e.t += dt
      if (s.driverOut || s.driverAnim) e.until = 0
      const f: EmoteFrame = { m: e.mood, k: 1, sx: 0, sy: 0, ty: 0, to: 1, ao: 1 }
      if (now >= e.until) {
        // Duck back into the cockpit.
        e.out += dt
        f.k = Math.max(0, 1 - e.out / 6) * EMOTE_SIZE
        s.emoteFrame = f
        if (e.out >= 6) {
          s.emote = null
          s.emoteFrame = null
        }
        return
      }
      // Pop up with a little overshoot.
      f.k = (e.t < 8 ? 0.3 + 0.7 * Math.sin((Math.min(1, e.t / 7) * Math.PI) / 2) * 1.08 : 1) * EMOTE_SIZE
      if (e.mood === 'smile') f.sy = -Math.abs(Math.sin(e.t * 0.3)) * 2.5
      if (e.mood === 'angry') {
        f.sx = Math.sin(e.t * 2.6) * 1.3
        f.ao = 0.55 + 0.45 * Math.abs(Math.sin(e.t * 0.4))
      }
      if (e.mood === 'cry') {
        f.ty = (e.t * 0.7) % 14
        f.to = 1 - ((e.t * 0.7) % 14) / 16
        f.sy = Math.sin(e.t * 0.9) * 0.6
      }
      s.emoteFrame = f
    }

    // ---------- Driving and the driver ----------
    const setDriving = (on: boolean) => {
      if (on && (s.driverOut || s.driverAnim)) {
        say(`The driver is out of the car. ${menuVerb} me and choose 'Driver in' first.`, 6)
        return
      }
      s.parked = !on
      if (s.mode === 'drive' && !on) s.mode = 'park'
      else if (s.mode === 'park' && on) s.mode = 'drive'
    }
    // The driver climbs from the cockpit to a spot behind the car.
    const setDriverOut = (out: boolean) => {
      if (out === s.driverOut || s.driverAnim || s.pit || s.mode === 'air' || s.mode === 'drag') return
      if (out) {
        if (race.on) stopRace(false)
        s.parked = true
        if (s.mode === 'drive') s.mode = 'park'
        s.driverOut = true
        s.helmet = false
        s.driverAnim = { dir: 'out', t: 0 }
        say(pick(['Stretching my legs. Car is parked.', 'Driver out. Time for a break, you too.', 'Out of the car. Water, then back to work?']), 5)
      } else {
        s.driverAnim = { dir: 'in', t: 0 }
        say('Strapping back in. Ready when you are.', 4)
      }
    }
    const stepDriver = (dt: number) => {
      const a = s.driverAnim
      const d = s.driver
      if (a) {
        a.t = Math.min(1, a.t + dt / 28)
        // p goes 1 -> 0 when climbing out, 0 -> 1 when climbing in.
        const p = a.dir === 'out' ? 1 - a.t : a.t
        d.x = DRIVER_FROM.x * p
        d.y = DRIVER_FROM.y * p - 38 * Math.sin(Math.PI * a.t)
        d.wave = 0
        if (a.t >= 1) {
          s.driverAnim = null
          if (a.dir === 'in') {
            s.helmet = true
            s.driverOut = false
          }
        }
      } else if (s.driverOut) {
        // Stand, breathe, and wave now and then.
        d.x = 0
        d.y = Math.sin(s.k * 0.12) * 0.6
        const t = s.k % 180
        d.wave = t < 40 ? -140 + 22 * Math.sin(t * 0.5) : 0
      }
    }
    // A click (or Enter) on the car calls it in for a pit stop.
    const tapCar = () => {
      if (s.driverOut) say(`The driver is out. ${menuVerb} me and choose 'Driver in'.`, 5)
      else startPitStop()
    }

    // ---------- Pit stop ----------
    const startPitStop = (compound?: Compound) => {
      if (s.pit || s.driverAnim || s.leaving || (s.mode !== 'drive' && s.mode !== 'park')) return
      const tyre = compound && TYRES[compound] ? compound : pick((Object.keys(TYRES) as Compound[]).filter((c) => c !== s.tyre))
      s.pit = { phase: 'in', t: 0, compound: tyre, swapped: false }
      s.mode = 'pit'
      s.v = 0
      s.crewX = 150
      say(`Box, box! ${tyre} tyres ready. Crew is out.`, 4)
    }
    const stepPitStop = (dt: number) => {
      const p = s.pit
      if (!p) return
      p.t += dt
      s.lines = [0, 0, 0]
      if (p.phase === 'in') {
        // Crew runs in from behind the car.
        s.spin = 0
        s.bob = 0
        s.crewX = 150 * (1 - Math.min(1, p.t / 14))
        if (p.t >= 14) {
          p.phase = 'work'
          p.t = 0
        }
      } else if (p.phase === 'work') {
        // Car up on the jacks, wheel guns going, old tyres off and new ones on.
        s.bob = -3
        s.spin = -40
        s.gun = p.t % 4 < 2 ? 1 : 0.55
        if (p.t >= 26 && !p.swapped) {
          p.swapped = true
          s.tyre = p.compound
        }
        if (p.t >= 52) {
          p.phase = 'out'
          p.t = 0
          s.bob = 0
          s.spin = 0
          s.gun = 1
          const secs = 1.9 + rand(140) / 100
          const time = secs.toFixed(1)
          const tyres = p.compound + 's'
          let line =
            secs < 2.4 ? `${time} seconds! Great stop. ${tyres} on.`
              : secs < 3.0 ? `${time} seconds. Good stop, ${tyres} on.`
                : `${time} seconds. Bit slow on the rear, but ${tyres} are on.`
          line += s.parked ? " The car's ready when the driver is." : ' Go, go, go!'
          say(line, 5)
          showEmote(secs < 3.0 ? 'smile' : 'cry', 3)
        }
      } else {
        // Crew clears the box, then the car leaves.
        s.crewX = 150 * Math.min(1, p.t / 12)
        if (p.t >= 12) {
          s.pit = null
          s.mode = s.parked ? 'park' : 'drive'
        }
      }
    }

    // ---------- Race mode ----------
    const myPosition = () => rivals.filter((r) => r.dist > s.dist).length + 1
    const startRace = () => {
      if (s.driverOut || s.driverAnim) {
        say(`Can't race without a driver. ${menuVerb} me and choose 'Driver in'.`, 6)
        return
      }
      const maxX = Math.max(0, viewWidth() - w)
      drag = null
      s.pit = null
      s.mode = 'drive'
      s.parked = false
      s.up = 0
      s.vup = 0
      s.vx = 0
      Object.assign(race, { on: true, finished: false, restartAt: 0, position: 0, check: 10 })
      for (const c of [s, ...rivals]) {
        Object.assign(c, { x: maxX - 4, dir: -1, lap: 0, dist: 0, v: 2 * scale, target: (3.6 + rand(100) / 100) * scale, retarget: 50 })
      }
      for (const r of rivals) r.el.classList.add('show')
      say(`Lights out and away we go! ${rivals.length + 1} cars, first to ${LAPS} laps.`, 5, 'race')
      beep()
    }
    const stopRace = (announce = true) => {
      race.on = false
      for (const r of rivals) r.el.classList.remove('show')
      if (announce) say('Race over. Back on the pit wall for you.', 4, 'race')
    }
    // One lap is one run across the window; the car turns at the edge and keeps going.
    const moveRaceCar = (c: RaceCar, dt: number, maxX: number) => {
      c.retarget -= dt
      if (race.finished) c.target = 2.2 * scale
      else if (c.retarget <= 0 || (Math.abs(c.target - c.v) < 0.05 * scale && Math.random() < dt / 40)) {
        c.target = (2.8 + rand(300) / 100) * scale
        c.retarget = 50
      }
      c.v += (c.target - c.v) * Math.min(1, 0.04 * dt)
      c.x += c.dir * c.v * dt
      c.dist += c.v * dt
      let lapped = false
      if (c.dir < 0 && c.x <= 0) {
        c.x = 0
        c.dir = 1
        lapped = true
      } else if (c.dir > 0 && c.x >= maxX) {
        c.x = maxX
        c.dir = -1
        lapped = true
      }
      if (lapped) c.lap++
      return lapped
    }
    const stepRace = (dt: number, now: number, maxX: number) => {
      if (race.finished && now > race.restartAt) {
        startRace()
        return
      }
      const meMoving = s.mode === 'drive'
      const meLap = meMoving && moveRaceCar(s, dt, maxX)
      let rivalDone = false
      for (const r of rivals) {
        moveRaceCar(r, dt, maxX)
        if (r.lap >= LAPS) rivalDone = true
        r.angle = (r.angle - (r.v / scale) * 8 * dt) % 360
        r.bob = Math.sin(s.k * 0.8 + r.phase) * 0.9
        r.lines = wave(s.k, 5, 0.33, r.phase)
      }
      if (meMoving) {
        s.spin = (s.v / scale) * 8
        s.bob = Math.sin(s.k * 0.9) * 0.9
        s.lines = wave(s.k, 4, 0.35)
      }
      if (race.finished) return

      // Chequered flag: the race ends when the first car finishes its last lap.
      if (s.lap >= LAPS || rivalDone) {
        race.finished = true
        race.restartAt = now + 10000
        const p = s.lap >= LAPS && !rivalDone ? 1 : myPosition()
        if (p === 1) {
          say('Chequered flag! P1! Simply lovely!', 6, 'race')
          beep()
          showEmote('smile', 6)
        } else if (p === 2) {
          say('P2. Good points today. We go again in 10 seconds.', 6, 'race')
          showEmote('smile', 4)
        } else {
          say(`P${p} this time. Reset and go again in 10 seconds.`, 6, 'race')
          showEmote('cry', 6)
        }
        return
      }
      if (meLap) say(`Lap ${s.lap} of ${LAPS}. Running P${myPosition()}. Keep pushing!`, 3, 'race')
      // Position changes
      race.check -= dt
      if (race.check > 0) return
      race.check = 10
      const p = myPosition()
      if (race.position && p !== race.position) {
        if (p < race.position) {
          invokeMood('smile', 60)
          say(p === 1 ? pick(['Overtake! P1!', 'Get in there! We lead!', 'Great move! P1!']) : pick([`Overtake! Up to P${p}.`, `Nice move. P${p}, keep going!`]), 3, 'race')
        } else {
          say(pick([`Lost a place. P${p}, push!`, `Down to P${p}. Mode push!`, `They're through. P${p}, fight back!`]), 3, 'race')
          invokeMood('angry', 70)
        }
      }
      race.position = p
    }

    // ---------- Arriving and leaving ----------
    const land = () => {
      s.vx = 0
      s.vup = 0
      s.mode = s.parked && !s.leaving ? 'park' : 'drive'
      if (s.leaving) return
      if (!s.landed) {
        s.landed = true
        s.nextChat = s.k + 6000 / TICK
        say('Lights out and away we go!', 4)
        beep()
      } else {
        say(pick(LANDING_LINES), 3)
        showEmote('smile', 2.5)
      }
    }
    const finish = () => {
      done = true
      setMenu(null)
      setShown(false)
    }
    const leave = () => {
      setMenu(null)
      if (reduced) {
        finish()
        return
      }
      if (race.on) stopRace(false)
      s.leaving = true
      s.pit = null
      // A driver standing beside the car hops back in for the drive home.
      if (s.driverOut || s.driverAnim) {
        s.driverOut = false
        s.driverAnim = null
        s.helmet = true
      }
      if (s.mode === 'park' || s.mode === 'pit') s.mode = 'drive'
      if (s.mode === 'drag') {
        drag = null
        s.mode = 'air'
      }
      // Head for the nearer edge.
      s.dir = s.x + w / 2 < viewWidth() / 2 ? -1 : 1
      say(pick(BYE_LINES), 3)
      showEmote('cry', 3)
    }
    const stay = () => {
      s.leaving = false
      say('Plan B! Staying out.', 3)
      showEmote('smile', 2)
    }

    // ---------- The menu ----------
    const status = (): BuddyStatus => {
      const what = s.driverOut || s.driverAnim ? 'Driver out'
        : s.pit ? 'In the pit box'
          : race.on ? `Racing · Lap ${Math.min(s.lap + 1, LAPS)}/${LAPS} · P${myPosition()}`
            : s.parked ? 'In the pits' : 'On track'
      return {
        text: `${what} · ${s.tyre}s`,
        dot: s.driverOut ? '#8A93A6' : !s.parked ? '#2E9E55' : '#E0A100',
        driving: !s.parked,
        racing: race.on,
        driverOut: s.driverOut,
        tyre: s.tyre
      }
    }
    const openMenu = (x: number, y: number) => {
      if (!s.leaving) setMenu({ at: { x, y }, status: status() })
    }
    actRef.current = (name, arg) => {
      if (s.leaving) return
      if (name === 'mood') showEmote(arg as Mood, 5)
      else if (name === 'drive') setDriving(s.parked)
      else if (name === 'race') {
        if (race.on) stopRace()
        else startRace()
      } else if (name === 'driver') setDriverOut(!s.driverOut)
      else if (name === 'pit') startPitStop(arg as Compound)
      else if (name === 'about') say(ABOUT_LINE, 10)
    }

    // ---------- Animation loop ----------
    const step = (dt: number, now: number) => {
      const on = getF1Buddy().active
      if (!on && !s.leaving) leave()
      else if (on && s.leaving) stay()
      if (done) return

      s.k += dt
      s.pop = Math.min(1, s.pop + 0.15 * dt)
      s.squash *= Math.pow(0.8, dt)
      stepDriver(dt)
      stepEmote(dt, now)
      if (s.bubbleKind && now > s.bubbleUntil) hush()
      const maxX = Math.max(0, viewWidth() - w)
      const maxUp = Math.max(0, viewHeight() - h)
      let tilt = 0

      if (race.on) stepRace(dt, now, maxX)
      if (s.mode === 'air') {
        s.vup -= GRAVITY * dt
        s.up += s.vup * dt
        s.x += s.vx * dt
        if (s.x < 0) {
          s.x = 0
          s.vx = Math.abs(s.vx) * 0.5
        } else if (s.x > maxX) {
          s.x = maxX
          s.vx = -Math.abs(s.vx) * 0.5
        }
        if (s.up > maxUp) {
          s.up = maxUp
          s.vup = -Math.abs(s.vup) * 0.3
        }
        s.spin *= Math.pow(0.97, dt)
        s.lines = [0, 0, 0]
        // Nose down on the way down.
        tilt = clamp(s.dir * -s.vup * 0.3, -10, 10)
        if (s.up <= 0) {
          s.up = 0
          const impact = -s.vup
          s.squash = Math.max(s.squash, Math.min(0.22, impact * 0.005))
          if (impact > 6) {
            s.vup = impact * 0.32
            s.vx *= 0.6
          } else land()
        }
      } else if (s.mode === 'drive' && !race.on) {
        const target = s.leaving ? speed * 2.6 : speed
        s.v += (target - s.v) * Math.min(1, 0.06 * dt)
        s.x += s.dir * s.v * dt
        // The car turns around at each edge of the window, and drives out of it when leaving.
        if (s.leaving) {
          if (s.x < -w * 1.2 || s.x > viewWidth() + w * 0.2) finish()
        } else if (s.dir < 0 && s.x <= 0) {
          s.x = 0
          s.dir = 1
        } else if (s.dir > 0 && s.x >= maxX) {
          s.x = maxX
          s.dir = -1
        }
        const pace = Math.min(1, s.v / speed)
        s.spin = (26 * s.v) / speed
        s.bob = Math.sin(s.k * 0.9) * 0.9 * pace
        s.lines = wave(s.k, 4, 0.35).map((l) => l * pace)
      } else if (s.mode === 'park') {
        s.v = 0
        s.spin = 0
        s.bob = s.k % 4 < 2 ? 0.35 : 0
        s.lines = [0, 0, 0]
      } else if (s.mode === 'pit') {
        stepPitStop(dt)
      } else if (drag) {
        s.spin *= Math.pow(0.97, dt)
        s.lines = [0, 0, 0]
        tilt = clamp(drag.vx * 0.6, -12, 12)
      }
      if (done) return

      // A radio call now and then (the first one says how to play), so the buddy has something to say.
      if (!race.on && !s.leaving && !s.bubbleKind && s.k > s.nextChat && (s.mode === 'drive' || s.mode === 'park')) {
        if (s.hinted) say(radioLine(), 5, 'chat')
        else {
          s.hinted = true
          say(touch ? 'Radio check! Tap me for the menu, drag me to fly.' : 'Radio check! Click me to box, drag me to fly, right-click for the menu.', 8, 'chat')
        }
        s.nextChat = s.k + (40000 + rand(20000)) / TICK
      }
      s.angle = (s.angle - s.spin * dt) % 360
      s.tilt += (tilt - s.tilt) * Math.min(1, 0.3 * dt)
      if (!s.leaving && s.mode !== 'drag') s.x = clamp(s.x, 0, maxX)
    }

    const render = () => {
      const pop = 0.3 + 0.7 * (1 - Math.pow(1 - s.pop, 3))
      root.style.transform = `translate3d(${s.x.toFixed(1)}px, ${(-s.up).toFixed(1)}px, 0)`
      box.style.transform = `rotate(${s.tilt.toFixed(2)}deg) scale(${(pop * (1 + s.squash * 0.6)).toFixed(3)}, ${(pop * (1 - s.squash)).toFixed(3)})`
      applyCarFrame(car, {
        a: s.angle,
        bob: s.bob,
        lines: s.lines,
        face: s.dir,
        helmet: s.helmet,
        tyre: TYRES[s.tyre],
        emote: s.emoteFrame,
        crew: s.pit ? { x: s.crewX, gun: s.gun } : null,
        driver: s.driverOut || s.driverAnim ? s.driver : null
      })
      if (race.on) {
        for (const r of rivals) {
          r.el.style.transform = `translate3d(${r.x.toFixed(1)}px, ${(-r.lane * scale).toFixed(1)}px, 0)`
          applyCarFrame(r.car, { a: r.angle, bob: r.bob, lines: r.lines, face: r.dir, helmet: true, tyre: TYRES.Medium, emote: null, crew: null, driver: null })
        }
      }
      if (s.bubbleKind) {
        // Keep the bubble inside the window, with its tail still pointing at the car,
        // and lift it clear of Max's head when he pops out.
        const centre = s.x + w / 2
        const shift = clamp(centre, bubbleHalf + 8, viewWidth() - bubbleHalf - 8) - centre
        const lift = s.emoteFrame ? (s.emoteFrame.k / EMOTE_SIZE) * h * 0.42 : 0
        bubble.style.transform = `translate(calc(-50% + ${shift.toFixed(1)}px), ${(-lift).toFixed(1)}px)`
        tail.style.transform = `translateX(${clamp(-shift, 18 - bubbleHalf, bubbleHalf - 18).toFixed(1)}px)`
      }
    }

    let last = performance.now()
    const frame = (now: number) => {
      const dt = clamp((now - last) / TICK, 0, 3)
      last = now
      step(dt, now)
      if (done) return
      render()
      raf = requestAnimationFrame(frame)
    }

    // ---------- Hover, click, drag and the menu ----------
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || s.mode === 'drag' || s.leaving) return
      if (s.bubbleKind && s.bubbleKind !== 'hover' && s.bubbleKind !== 'chat') return
      say(radioLine(), 30, 'hover')
      if (rand(4) === 0) showEmote('smile', 2.5)
    }
    const onLeave = () => {
      if (s.bubbleKind === 'hover') s.bubbleUntil = Math.min(s.bubbleUntil, performance.now() + 1500)
    }
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || s.leaving) return
      // The menu leaves presses on the car to the car: one closes it, so a second tap toggles it shut.
      menuWasOpen = menuOpenRef.current
      touchTap = false
      if (menuWasOpen) setMenu(null)
      box.setPointerCapture(e.pointerId)
      const top = viewHeight() - s.up - h
      drag = { id: e.pointerId, ox: e.clientX - s.x, oy: e.clientY - top, sx: e.clientX, sy: e.clientY, moved: 0, lx: e.clientX, ly: e.clientY, lt: e.timeStamp, vx: 0, vy: 0 }
    }
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return
      drag.moved = Math.max(drag.moved, Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy))
      if (s.mode !== 'drag') {
        // Not while the car is up on the jacks or the driver is out.
        if (drag.moved < 6 || s.mode === 'pit' || s.driverOut || s.driverAnim) return
        s.mode = 'drag'
        s.v = 0
        say(pick(GRAB_LINES), 30, 'drag')
        showEmote('angry', 30)
      }
      const ticks = Math.max(0.25, (e.timeStamp - drag.lt) / TICK)
      drag.vx = drag.vx * 0.5 + ((e.clientX - drag.lx) / ticks) * 0.5
      drag.vy = drag.vy * 0.5 + ((e.clientY - drag.ly) / ticks) * 0.5
      drag.lx = e.clientX
      drag.ly = e.clientY
      drag.lt = e.timeStamp
      s.x = clamp(e.clientX - drag.ox, 0, Math.max(0, viewWidth() - w))
      s.up = clamp(viewHeight() - (e.clientY - drag.oy) - h, 0, Math.max(0, viewHeight() - h))
    }
    const release = (e: PointerEvent, click: boolean) => {
      if (box.hasPointerCapture(e.pointerId)) box.releasePointerCapture(e.pointerId)
      if (!drag || e.pointerId !== drag.id) return
      const d = drag
      drag = null
      if (s.mode === 'drag') {
        // Let go: the car flies on at the pointer's speed and falls back to the floor.
        const still = e.timeStamp - d.lt > 80
        s.mode = 'air'
        s.vx = still ? 0 : clamp(d.vx, -30, 30)
        s.vup = still ? 0 : clamp(-d.vy, -30, 30)
        if (Math.abs(s.vx) > 2) s.dir = Math.sign(s.vx)
        if (s.emote) s.emote.until = 0
        if (s.bubbleKind === 'drag') hush()
      } else if (click && d.moved < 6) {
        if (e.pointerType === 'mouse') tapCar()
        else touchTap = !menuWasOpen
      }
    }
    const onUp = (e: PointerEvent) => release(e, true)
    const onCancel = (e: PointerEvent) => release(e, false)
    // A tap opens the menu on the click that follows it, not on pointerup, so that click can't land on
    // the menu. The card goes above the car rather than over the finger (its bottom edge sits 14 px below
    // the point it opens at), leaving the car clear to tap again and close it.
    const onClick = (e: MouseEvent) => {
      if (!touchTap) return
      touchTap = false
      openMenu(e.clientX, box.getBoundingClientRect().top - 22)
    }
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      if (s.mode === 'drag') return
      drag = null
      // From the keyboard (context menu key, Shift+F10) there is no pointer: open it over the car.
      const r = box.getBoundingClientRect()
      const fromKeyboard = e.clientX === 0 && e.clientY === 0
      openMenu(fromKeyboard ? r.left + r.width / 2 : e.clientX, fromKeyboard ? r.top + r.height / 2 : e.clientY)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      tapCar()
    }

    hush()
    if (reduced) say(touch ? 'Parked and ready. Tap me for the menu.' : 'Parked and ready. Click me for a pit stop.', 5)
    box.addEventListener('pointerenter', onEnter)
    box.addEventListener('pointerleave', onLeave)
    box.addEventListener('pointerdown', onDown)
    box.addEventListener('pointermove', onMove)
    box.addEventListener('pointerup', onUp)
    box.addEventListener('pointercancel', onCancel)
    box.addEventListener('click', onClick)
    box.addEventListener('contextmenu', onContextMenu)
    box.addEventListener('keydown', onKey)
    window.addEventListener('resize', resize)
    render()
    raf = requestAnimationFrame(frame)

    return () => {
      done = true
      cancelAnimationFrame(raf)
      actRef.current = null
      box.removeEventListener('pointerenter', onEnter)
      box.removeEventListener('pointerleave', onLeave)
      box.removeEventListener('pointerdown', onDown)
      box.removeEventListener('pointermove', onMove)
      box.removeEventListener('pointerup', onUp)
      box.removeEventListener('pointercancel', onCancel)
      box.removeEventListener('click', onClick)
      box.removeEventListener('contextmenu', onContextMenu)
      box.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', resize)
      box.innerHTML = ''
      for (const r of rivals) r.el.innerHTML = ''
      audio?.close().catch(() => {})
    }
  }, [shown])

  if (!shown) return null

  return (
    <>
      {RIVALS.map((rival, i) => (
        <div
          key={rival.id}
          ref={(el) => {
            rivalRefs.current[i] = el
          }}
          className="f1-buddy f1-buddy-rival"
          aria-hidden="true"
        ></div>
      ))}
      <div ref={rootRef} className="f1-buddy">
        <div ref={bubbleRef} className="f1-buddy-bubble" role="status" aria-live="polite">
          <div className="f1-buddy-radio">
            <div className="f1-buddy-card">
              <div className="f1-buddy-label">TEAM RADIO</div>
              <div ref={textRef} className="f1-buddy-text"></div>
            </div>
            <div ref={tailRef} className="f1-buddy-tail"></div>
          </div>
        </div>
        <div
          ref={carRef}
          className="f1-buddy-car"
          role="button"
          tabIndex={0}
          aria-label="F1 Buddy, the Pit Wall car. Press Enter for a pit stop, or the context menu key for more."
        ></div>
      </div>
      {menu && <F1BuddyMenu at={menu.at} status={menu.status} car={carRef} onAction={runMenuAction} onClose={closeMenu} />}
    </>
  )
}
