// The Pit Wall car, drawn in SVG (ported from Pit Wall's ubuntu/renderer/car-art.js).
// carSvg(livery, id) returns the markup; bindCar(root, id) + applyCarFrame(parts, frame) move the
// wheels, Max's moods, the pit crew and the driver for one animation frame. Every id in a drawing
// starts with its own prefix, so several cars (Race mode) can share the page.

export interface Livery {
  body: string
  stripe: string
  accent: string
  number: string
  numberColor: string
}

export type Mood = 'smile' | 'angry' | 'cry'

export interface EmoteFrame {
  m: Mood
  k: number
  sx: number
  sy: number
  ty: number
  to: number
  ao: number
}

export interface CarFrame {
  a: number
  bob: number
  lines: number[]
  face: number
  helmet: boolean
  tyre: string
  emote: EmoteFrame | null
  crew: { x: number; gun: number } | null
  driver: { x: number; y: number; wave: number } | null
}

// Team colours from Pit Wall's main/livery.js. Red Bull Racing #3 is the default.
export const LIVERIES = {
  redbull: { body: '#233071', stripe: '#D6203A', accent: '#FFCC00', number: '3', numberColor: '#FFFFFF' },
  mclaren: { body: '#FF8000', stripe: '#16181C', accent: '#47C7FC', number: '1', numberColor: '#FFFFFF' },
  mercedes: { body: '#C3C8D0', stripe: '#00A19B', accent: '#00D2BE', number: '12', numberColor: '#FFFFFF' },
  ferrari: { body: '#DC0000', stripe: '#FFF200', accent: '#16181C', number: '44', numberColor: '#16181C' }
} satisfies Record<string, Livery>

// Tyre compounds and the colour of their sidewall ring.
export const TYRES = { Soft: '#E10600', Medium: '#F5C518', Hard: '#F0F0F0' }
export type Compound = keyof typeof TYRES

// #AARRGGBB or #RRGGBB -> colour and opacity
function col(hex: string) {
  const h = hex.replace('#', '')
  if (h.length === 8) return { c: '#' + h.slice(2), o: +(parseInt(h.slice(0, 2), 16) / 255).toFixed(3) }
  return { c: '#' + h, o: 1 }
}
const fill = (hex: string) => {
  const k = col(hex)
  return `fill="${k.c}"${k.o < 1 ? ` fill-opacity="${k.o}"` : ''}`
}
const stroke = (hex: string, w: number) => {
  const k = col(hex)
  return `stroke="${k.c}"${k.o < 1 ? ` stroke-opacity="${k.o}"` : ''} stroke-width="${w}"`
}
const stops = (list: [string, number][]) =>
  list
    .map(([h, off]) => {
      const k = col(h)
      return `<stop offset="${off}" stop-color="${k.c}" stop-opacity="${k.o}"/>`
    })
    .join('')
interface RadialOptions {
  cx?: number
  cy?: number
  r?: number
  fx?: number
  fy?: number
  t?: string
}
const rect = (x: number, y: number, w: number, h: number, r: number, f: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}"${r ? ` rx="${r}" ry="${r}"` : ''} ${f} ${extra}/>`
const ell = (left: number, top: number, w: number, h: number, f: string, extra = '') =>
  `<ellipse cx="${left + w / 2}" cy="${top + h / 2}" rx="${w / 2}" ry="${h / 2}" ${f} ${extra}/>`
const round = 'stroke-linecap="round" fill="none"'

export function carSvg(livery: Livery = LIVERIES.redbull, id = 'pw') {
  const P = `${id}-`
  const url = (name: string) => `url(#${P}${name})`
  const pid = (name: string) => `id="${P}${name}"`
  const lin = (name: string, x1: number, y1: number, x2: number, y2: number, s: [string, number][]) =>
    `<linearGradient ${pid(name)} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(s)}</linearGradient>`
  const rad = (name: string, s: [string, number][], o: RadialOptions = {}) =>
    `<radialGradient ${pid(name)} cx="${o.cx ?? 0.5}" cy="${o.cy ?? 0.5}" r="${o.r ?? 0.5}" fx="${o.fx ?? o.cx ?? 0.5}" fy="${o.fy ?? o.cy ?? 0.5}"${o.t ? ` gradientTransform="${o.t}"` : ''}>${stops(s)}</radialGradient>`

  const gloss: [string, number][] = [['#70FFFFFF', 0], ['#3DFFFFFF', 0.22], ['#12FFFFFF', 0.42], ['#00000000', 0.56], ['#1F000000', 0.78], ['#4D000000', 1]]
  const defs =
    '<defs>' +
    rad('glow', [['#4D8FDCE6', 0], ['#268FDCE6', 0.45], ['#008FDCE6', 1]]) +
    rad('shadow', [['#80000000', 0], ['#33000000', 0.6], ['#00000000', 1]]) +
    lin('gloss', 0, 0, 0, 1, gloss) +
    rad('sidepod', [['#40FFFFFF', 0], ['#00FFFFFF', 0.6], ['#33000000', 1]], { cx: 0.45, cy: 0.3, r: 1, fx: 0.45, fy: 0.15, t: 'translate(0.45 0.3) scale(0.6 0.9) translate(-0.45 -0.3)' }) +
    lin('edge', 0, 0, 1, 0, [['#33FFFFFF', 0], ['#B3FFFFFF', 0.45], ['#40FFFFFF', 1]]) +
    lin('fin', 0, 0, 1, 0, [['#00FFFFFF', 0], ['#40FFFFFF', 0.55], ['#22000000', 1]]) +
    rad('helmetShade', [['#FFFFFF', 0], ['#E6E8EC', 0.6], ['#A9AFB9', 1]], { fx: 0.35, fy: 0.25 }) +
    lin('visor', 0, 0, 0, 1, [['#4A5A7A', 0], ['#16181C', 0.6]]) +
    lin('suit', 0, 0, 1, 0.25, [['#40000000', 0], ['#38FFFFFF', 0.38], ['#00FFFFFF', 0.62], ['#66000000', 1]]) +
    rad('head', [['#FFFFFF', 0], ['#E6E8EC', 0.6], ['#A3A9B4', 1]], { fx: 0.35, fy: 0.28 }) +
    rad('tyre', [['#34383F', 0.62], ['#1A1C21', 0.82], ['#08090B', 1]]) +
    rad('rim', [['#E3E7EC', 0], ['#A3AAB4', 0.55], ['#5D636E', 1]], { fx: 0.38, fy: 0.32 }) +
    lin('wheelShade', 0.2, 0, 0.8, 1, [['#55FFFFFF', 0], ['#00FFFFFF', 0.35], ['#00000000', 0.6], ['#70000000', 1]]) +
    '</defs>'

  // A rectangle in team kit, with the soft sheen on top.
  const suit = (x: number, y: number, w: number, h: number, r: number, body: string) => rect(x, y, w, h, r, fill(body)) + rect(x, y, w, h, r, `fill="${url('suit')}"`)

  const wheel = (name: string, cx: number, cy: number, r: number, stripe: string) => {
    const d = 2 * r
    const k = (r - 12) * 0.7
    const line = (x1: number, y1: number, x2: number, y2: number, cap = true) =>
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${stroke('#5D636E', 2.5)}${cap ? ' stroke-linecap="round"' : ''}/>`
    return (
      `<g ${pid(name)}><g transform="translate(${cx - r} ${cy - r})">` +
      ell(0, 0, d, d, `fill="${url('tyre')}"`) +
      `<circle ${pid(name + 'Ring')} cx="${r}" cy="${r}" r="${r - 3 - 1.25}" fill="none" ${stroke('#F5C518', 2.5)}/>` +
      `<circle cx="${r}" cy="${r}" r="${r - 8}" ${fill('#2B2E35')}/>` +
      `<circle cx="${r}" cy="${r}" r="${r - 9}" fill="${url('rim')}"/>` +
      `<circle cx="${r}" cy="${r}" r="7" ${fill('#4A505A')}/>` +
      line(10, r, d - 10, r) +
      line(r, 10, r, d - 10) +
      line(r - k, r - k, r + k, r + k, false) +
      line(r - k, r + k, r + k, r - k, false) +
      `<circle cx="${r}" cy="${r}" r="4.5" ${fill(stripe)}/>` +
      `</g></g>` +
      `<g transform="translate(${cx - r} ${cy - r})" pointer-events="none">` +
      ell(0, 0, d, d, `fill="${url('wheelShade')}"`) +
      `<path d="M ${r * 0.42} ${r * 0.55} A ${r * 0.82} ${r * 0.82} 0 0 1 ${r * 1.25} ${r * 0.22}" ${stroke('#66FFFFFF', 1.6)} ${round}/>` +
      `</g>`
    )
  }

  const B = livery.body
  const S = livery.stripe
  const A = livery.accent
  const bodyPath = 'M30 70 C 34 46 70 34 112 32 L 150 30 C 172 30 186 42 206 50 L 300 60 C 312 61 322 66 324 72 L 30 72 Z'
  const wing = 'M0 12 L 44 10 L 46 26 L 2 28 Z'
  const nose = 'M300 70 L 336 68 L 340 84 L 296 84 Z'
  const fin = 'M110 32 L 128 14 L 150 14 L 150 30 Z'
  const dark = '#16181C'
  const face = (d: string, w: number) => `<path d="${d}" ${stroke(dark, w)} ${round}/>`

  return (
    `<svg class="car" viewBox="0 0 400 108" preserveAspectRatio="xMidYMid meet" overflow="visible" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">` +
    defs +
    `<rect x="0" y="0" width="400" height="108" fill="#000" fill-opacity="0.004"/>` +
    ell(10, -6, 340, 118, `fill="${url('glow')}"`, 'pointer-events="none"') +
    ell(40, 92, 282, 12, `fill="${url('shadow')}"`) +
    rect(348, 34, 46, 2.5, 1, fill('#CCE9EDF2'), pid('line1')) +
    rect(356, 54, 38, 2.5, 1, fill('#CCE9EDF2'), pid('line2')) +
    rect(344, 70, 50, 2.5, 1, fill('#CCE9EDF2'), pid('line3')) +
    `<g ${pid('bob')}>` +
    // Car drawn facing right, mirrored so it drives to the left.
    `<g transform="matrix(-1 0 0 1 340 0)">` +
    rect(8, 20, 10, 44, 2, fill(B)) +
    `<path d="${wing}" ${fill(B)}/><path d="${wing}" fill="${url('gloss')}"/>` +
    rect(8, 20, 4, 44, 0, fill('#33FFFFFF')) +
    rect(2, 18, 42, 4, 0, fill(S)) +
    rect(8, 46, 10, 9, 0, fill(A)) +
    rect(4, 56, 6, 6, 0, fill('#FF2B2B')) +
    `<path d="M20 74 L318 74 L324 80 L22 80 Z" ${fill(dark)}/>` +
    `<path d="M20 74 L318 74" ${stroke('#4D525C', 1)} fill="none"/>` +
    `<path d="${bodyPath}" ${fill(B)}/><path d="${bodyPath}" fill="${url('gloss')}"/>` +
    `<path d="M120 66 C 124 52 150 46 186 47 C 222 48 252 54 262 62 L 262 70 L 120 70 Z" fill="${url('sidepod')}"/>` +
    `<path d="M110 58 C 160 52 240 54 306 64 L 306 67 C 240 58 160 57 110 62 Z" ${fill(S)}/>` +
    `<path d="M44 56 C 56 44 82 37 114 35 L 150 33 C 168 33 180 41 198 49 L 296 61" ${stroke('#66FFFFFF', 2.4)} ${round} opacity="0.7"/>` +
    `<path d="M30 70 C 34 46 70 34 112 32 L 150 30 C 172 30 186 42 206 50 L 300 60 C 312 61 322 66 324 72" stroke="${url('edge')}" stroke-width="1.3" ${round}/>` +
    `<path d="${fin}" ${fill(B)}/><path d="${fin}" fill="${url('fin')}"/>` +
    `<path d="M128 14 L 150 14" ${stroke('#99FFFFFF', 1.2)} fill="none"/>` +
    `<path d="M158 44 C 166 34 196 34 206 50 Z" ${fill(dark)}/>` +
    `<path d="M160 44 C 168 36 194 36 204 49" ${stroke('#3A3F49', 1)} fill="none"/>` +
    `<g ${pid('helmet')}>` +
    ell(165, 25, 22, 22, `fill="${url('helmetShade')}"`) +
    `<path d="M176 31 L 188 31 C 188 38 184 40 180 40 L 176 40 Z" fill="${url('visor')}"/></g>` +
    `<path d="M152 42 C 160 22 196 22 214 46" ${stroke(dark, 4)} ${round}/>` +
    `<path d="${nose}" ${fill(S)}/><path d="${nose}" fill="${url('gloss')}"/>` +
    `<path d="M312 64 C 320 64 326 67 327 72 L 310 72 Z" ${fill(A)}/>` +
    `</g>` +
    `<g ${pid('badge')}>` +
    rect(96, 54, 28, 16, 8, fill(S)) +
    `<text x="110" y="62.5" text-anchor="middle" dominant-baseline="central" font-family="Segoe UI, Ubuntu, Noto Sans, sans-serif" font-weight="800" font-size="12" ${fill(livery.numberColor)}>${livery.number}</text></g>` +
    // Max's moods: his head pops out of the cockpit.
    `<g ${pid('emote')} style="display:none">` +
    rect(150, 16, 28, 20, 7, fill(B)) +
    rect(150, 16, 28, 20, 7, `fill="${url('suit')}"`) +
    rect(157, 16, 14, 3, 0, fill(A)) +
    ell(143, -21, 42, 42, `fill="${url('head')}"`, stroke('#C9D0DC', 1)) +
    ell(143, -21, 42, 42, fill('#66E10600'), `${pid('emoteFlush')} style="display:none"`) +
    rect(148, -14, 32, 4, 2, fill(S)) +
    rect(149, -9, 30, 5, 2, fill(dark)) +
    rect(149, -5, 30, 21, 9, fill('#F2C9A0')) +
    `<g ${pid('eyes')}>` +
    ell(156, 0, 3.6, 3.6, fill(dark)) +
    ell(168.4, 0, 3.6, 3.6, fill(dark)) +
    `</g>` +
    `<g ${pid('eyesHappy')}>${face('M154.5 3 Q158 -1.5 161.5 3 M166.5 3 Q170 -1.5 173.5 3', 1.7)}</g>` +
    `<g ${pid('browsAngry')}>${face('M153.5 -3.5 L161 -0.5 M174.5 -3.5 L167 -0.5', 1.9)}</g>` +
    `<g ${pid('browsSad')}>${face('M154 -0.5 L161 -3.5 M174 -0.5 L167 -3.5', 1.7)}</g>` +
    `<path ${pid('mouthSmile')} d="M157 7.5 Q164 15 171 7.5 Z" ${fill('#7A1F1F')} ${stroke(dark, 0.8)}/>` +
    `<g ${pid('mouthAngry')}>${face('M157.5 11.5 Q164 6.5 170.5 11.5', 1.9)}</g>` +
    ell(160, 8, 8, 6, fill('#7A1F1F'), pid('mouthCry')) +
    `<g ${pid('tears')}><path d="M156.5 5 Q154.5 8.5 156.5 10 Q158.5 8.5 156.5 5 Z" ${fill('#4FB3F7')}/><path d="M171.5 5 Q169.5 8.5 171.5 10 Q173.5 8.5 171.5 5 Z" ${fill('#4FB3F7')}/></g>` +
    `<path ${pid('angerMark')} d="M180 -23 Q183 -20 186 -23 M180 -14 Q183 -17 186 -14 M179 -22 Q182 -18.5 179 -15 M187 -22 Q184 -18.5 187 -15" ${stroke('#E10600', 1.8)} ${round}/>` +
    `</g>` +
    `</g>` +
    wheel('wheelF', 72, 74, 23, S) +
    wheel('wheelR', 266, 72, 26, S) +
    // Pit crew, shown during a pit stop.
    `<g ${pid('crew')} style="display:none">` +
    suit(98, 88, 17, 7, 3, B) +
    rect(110, 92, 8, 4, 1, fill(dark)) +
    suit(100, 76, 13, 14, 4, B) +
    rect(100, 84, 13, 2.5, 0, fill(S)) +
    ell(99, 64, 13, 13, `fill="${url('head')}"`, stroke('#C9D0DC', 0.6)) +
    rect(99, 68, 7, 4, 1, fill(dark)) +
    rect(88, 78, 13, 5, 1, fill('#2B2F36'), 'class="gun"') +
    suit(221, 88, 17, 7, 3, B) +
    rect(218, 92, 8, 4, 1, fill(dark)) +
    suit(223, 76, 13, 14, 4, B) +
    rect(223, 84, 13, 2.5, 0, fill(S)) +
    ell(224, 64, 13, 13, `fill="${url('head')}"`, stroke('#C9D0DC', 0.6)) +
    rect(230, 68, 7, 4, 1, fill(dark)) +
    rect(235, 78, 13, 5, 1, fill('#2B2F36'), 'class="gun"') +
    suit(345, 80, 6, 16, 3, B) +
    suit(353, 80, 6, 16, 3, B) +
    suit(343, 60, 17, 23, 5, B) +
    rect(343, 74, 17, 3, 0, fill(S)) +
    ell(344, 45, 15, 15, `fill="${url('head')}"`, stroke('#C9D0DC', 0.6)) +
    rect(344, 50, 8, 4, 1, fill(dark)) +
    `<line x1="344" y1="70" x2="322" y2="80" ${stroke(A, 3)} stroke-linecap="round"/>` +
    rect(316, 78, 10, 6, 1, fill('#2B2F36')) +
    `</g>` +
    // The driver, shown when they get out of the car.
    `<g ${pid('driver')} style="display:none">` +
    suit(362, 72, 7, 20, 3, B) +
    suit(371, 72, 7, 20, 3, B) +
    rect(359, 89, 11, 6, 2, fill(dark)) +
    rect(370, 89, 11, 6, 2, fill(dark)) +
    suit(355, 52, 6, 19, 3, B) +
    suit(360, 49, 20, 26, 6, B) +
    rect(360, 66, 20, 4, 0, fill(S)) +
    rect(366, 53, 8, 3, 0, fill(A)) +
    rect(379, 52, 6, 19, 3, fill(B), pid('waveArm')) +
    ell(360, 30, 20, 21, `fill="${url('head')}"`, stroke('#C9D0DC', 0.8)) +
    rect(362, 33, 16, 2.5, 0, fill(S)) +
    `<path d="M360 39 L 372 39 C 372 45 369 47 365 47 L 361 47 Z" ${fill(dark)}/>` +
    `</g>` +
    `</svg>`
  )
}

const EMOTE_PARTS: Record<Mood, string[]> = {
  smile: ['eyesHappy', 'mouthSmile'],
  angry: ['eyes', 'browsAngry', 'mouthAngry', 'emoteFlush', 'angerMark'],
  cry: ['eyes', 'browsSad', 'mouthCry', 'tears']
}
const ALL_PARTS = ['eyes', 'eyesHappy', 'browsAngry', 'browsSad', 'mouthSmile', 'mouthAngry', 'mouthCry', 'tears', 'angerMark', 'emoteFlush']

export interface CarParts {
  svg: SVGSVGElement
  part: Record<string, SVGElement>
  guns: SVGElement[]
  last: { face?: number; tyre?: string; mood?: Mood | null }
}

// Looks up the parts of one drawing once, then applies frames to them.
export function bindCar(root: HTMLElement, id = 'pw'): CarParts {
  const part: Record<string, SVGElement> = {}
  for (const name of ['wheelF', 'wheelR', 'wheelFRing', 'wheelRRing', 'bob', 'line1', 'line2', 'line3', 'helmet', 'badge', 'emote', 'crew', 'driver', 'waveArm', ...ALL_PARTS]) {
    part[name] = root.querySelector(`#${id}-${name}`) as SVGElement
  }
  return {
    svg: root.querySelector('svg.car') as SVGSVGElement,
    part,
    guns: [...root.querySelectorAll<SVGElement>(`#${id}-crew .gun`)],
    last: {}
  }
}

const show = (node: SVGElement | undefined, on: boolean) => {
  if (node) node.style.display = on ? '' : 'none'
}

export function applyCarFrame(el: CarParts, f: CarFrame) {
  const p = el.part
  p.wheelF.setAttribute('transform', `rotate(${f.a.toFixed(1)} 72 74)`)
  p.wheelR.setAttribute('transform', `rotate(${f.a.toFixed(1)} 266 72)`)
  p.bob.setAttribute('transform', `translate(0 ${(f.bob || 0).toFixed(2)})`)
  for (let i = 0; i < 3; i++) p['line' + (i + 1)].setAttribute('opacity', (f.lines[i] ?? 0).toFixed(2))
  if (el.last.face !== f.face) {
    el.last.face = f.face
    el.svg.style.transform = f.face > 0 ? 'scaleX(-1)' : ''
    p.badge.setAttribute('transform', f.face > 0 ? 'matrix(-1 0 0 1 220 0)' : '')
  }
  show(p.helmet, f.helmet)
  if (el.last.tyre !== f.tyre) {
    el.last.tyre = f.tyre
    p.wheelFRing.setAttribute('stroke', f.tyre)
    p.wheelRRing.setAttribute('stroke', f.tyre)
  }
  const e = f.emote
  show(p.emote, !!e)
  if (e) {
    if (el.last.mood !== e.m) {
      el.last.mood = e.m
      for (const part of ALL_PARTS) show(p[part], EMOTE_PARTS[e.m].includes(part))
    }
    p.emote.setAttribute('transform', `translate(${e.sx.toFixed(2)} ${e.sy.toFixed(2)}) translate(164 34) scale(${e.k.toFixed(3)}) translate(-164 -34)`)
    if (e.m === 'cry') {
      p.tears.setAttribute('transform', `translate(0 ${e.ty.toFixed(2)})`)
      p.tears.setAttribute('opacity', e.to.toFixed(2))
    }
    if (e.m === 'angry') p.angerMark.setAttribute('opacity', e.ao.toFixed(2))
  } else el.last.mood = null
  show(p.crew, !!f.crew)
  if (f.crew) {
    p.crew.setAttribute('transform', `translate(${f.crew.x.toFixed(1)} 0)`)
    for (const g of el.guns) g.setAttribute('opacity', String(f.crew.gun))
  }
  show(p.driver, !!f.driver)
  if (f.driver) {
    p.driver.setAttribute('transform', `translate(${f.driver.x.toFixed(1)} ${f.driver.y.toFixed(1)})`)
    p.waveArm.setAttribute('transform', `rotate(${f.driver.wave.toFixed(1)} 382 53.9)`)
  }
}
