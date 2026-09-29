import { useEffect, useMemo, useRef } from 'react'
import type * as THREE from 'three'
import reactIcon from '../assets/icons/react.webp'
import apiIcon from '../assets/icons/api.png'
import vueIcon from '../assets/icons/vue.webp'
import htmlIcon from '../assets/icons/html.webp'
import cssIcon from '../assets/icons/css.webp'
import jsIcon from '../assets/icons/javascript.png'
import nodeIcon from '../assets/icons/node.webp'
import tsIcon from '../assets/icons/ts.webp'
import ionicIcon from '../assets/icons/ionic.webp'

interface Props {
  stack?: string[]
}

interface TechIcon {
  label: string
  svg: string | null
  image?: string
}

const techIcons: Record<string, TechIcon> = {
  vue: { label: 'Vue', svg: null, image: vueIcon },
  html: { label: 'HTML', svg: null, image: htmlIcon },
  css: { label: 'CSS', svg: null, image: cssIcon },
  js: { label: 'JS', svg: null, image: jsIcon },
  react: { label: 'React', svg: null, image: reactIcon },
  node: { label: 'Node', svg: null, image: nodeIcon },
  typescript: { label: 'TS', svg: null, image: tsIcon },
  ionic: { label: 'Ionic', svg: null, image: ionicIcon },
  api: { label: 'API', svg: null, image: apiIcon }
}

function normalizeTech(name: string): string | null {
  const n = (name || '').toLowerCase().trim()
  if (n === 'vue' || n === 'vue.js' || n === 'vuejs') return 'vue'
  if (n === 'html') return 'html'
  if (n === 'css') return 'css'
  if (n === 'js' || n === 'javascript') return 'js'
  if (n === 'react' || n === 'react.js') return 'react'
  if (n === 'ionic') return 'ionic'
  if (n === 'node' || n === 'node.js') return 'node'
  if (n === 'ts' || n === 'typescript') return 'typescript'
  if (n === 'rest apis' || n === 'rest api' || n === 'api') return 'api'
  return null
}

// Spreads any number of items evenly around an ellipse centered on the laptop,
// instead of a fixed set of hand-placed CSS positions capped at a fixed count.
function orbitPosition(index: number, total: number): { left: string; top: string } {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2
  const radiusX = 42
  const radiusY = 40
  const left = 50 + radiusX * Math.cos(angle)
  const top = 50 + radiusY * Math.sin(angle)
  return { left: `${left}%`, top: `${top}%` }
}

export default function DeveloperScene({ stack = ['Vue', 'HTML', 'CSS', 'JS'] }: Props) {
  const canvasEl = useRef<HTMLCanvasElement | null>(null)

  const displayStack = useMemo(() => {
    const entries = stack || []
    return entries.map((name, i) => {
      const key = normalizeTech(name)
      const tech = key ? techIcons[key] : null
      return {
        key: `${name}-${i}`,
        label: tech ? tech.label : name,
        svg: tech ? tech.svg : null,
        image: tech ? tech.image : undefined,
        ...orbitPosition(i, entries.length),
        delay: `${(i % 6) * 0.15}s`
      }
    })
  }, [stack])

  useEffect(() => {
    let cleanup: (() => void) | null = null
    let cancelled = false

    ;(async () => {
      const THREE = await import('three')
      if (cancelled || !canvasEl.current) return // unmounted before the chunk loaded

      const readAccentColor = () => {
        const value = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
        return new THREE.Color(value || '#22d3ee')
      }

      const canvas = canvasEl.current
      const parent = canvas.parentElement!

      // Resizing dev tools' device emulation (or other GPU hiccups) can trigger a
      // WebGL "context lost" event, which otherwise leaves the canvas permanently
      // blank. `teardown` disposes the current scene/renderer; `buildScene` (re-)
      // creates everything from scratch, so `webglcontextrestored` can fully revive it.
      let teardown: (() => void) | null = null

      const buildScene = () => {
        teardown?.()

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
        camera.position.set(0, 0.6, 6.5)

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        let accent = readAccentColor()

        const ambient = new THREE.AmbientLight(0xffffff, 0.7)
        scene.add(ambient)
        const keyLight = new THREE.DirectionalLight(0xffffff, 0.7)
        keyLight.position.set(3, 4, 5)
        scene.add(keyLight)
        const accentLight = new THREE.PointLight(accent, 2, 12)
        accentLight.position.set(-2, 1.2, 2.5)
        scene.add(accentLight)

        const rig = new THREE.Group()
        scene.add(rig)

        // Laptop base + keyboard deck
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.4, roughness: 0.5 })
        const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 1.6), baseMat)
        base.position.y = -0.55
        rig.add(base)
        const deck = new THREE.Mesh(
          new THREE.BoxGeometry(2.1, 0.02, 1.3),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.3, roughness: 0.6 })
        )
        deck.position.set(0, -0.47, 0.05)
        rig.add(deck)

        // Hinged screen
        const screenHinge = new THREE.Group()
        screenHinge.position.set(0, -0.48, -0.78)
        screenHinge.rotation.x = -0.35
        rig.add(screenHinge)

        const screenFrame = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 1.5, 0.08),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.3, roughness: 0.6 })
        )
        screenFrame.position.y = 0.76
        screenHinge.add(screenFrame)

        const screenLit = new THREE.Mesh(
          new THREE.PlaneGeometry(2.15, 1.28),
          new THREE.MeshBasicMaterial({ color: 0x0f172a })
        )
        screenLit.position.set(0, 0.76, 0.045)
        screenHinge.add(screenLit)

        const codeLineColors = [accent, 0xc084fc, 0x86efac, 0xfacc15]
        const codeLines: THREE.Mesh[] = []
        for (let i = 0; i < 6; i++) {
          const width = 0.55 + Math.random() * 0.9
          const mat = new THREE.MeshBasicMaterial({
            color: codeLineColors[i % codeLineColors.length] as THREE.ColorRepresentation,
            transparent: true,
            opacity: 0.85
          })
          const line = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.07), mat)
          line.position.set(-1.05 + width / 2, 1.18 - i * 0.19, 0.05)
          line.userData.baseOpacity = 0.4 + Math.random() * 0.5
          screenHinge.add(line)
          codeLines.push(line)
        }

        // Ambient particles
        const particleCount = 90
        const positionsArr = new Float32Array(particleCount * 3)
        for (let i = 0; i < particleCount; i++) {
          positionsArr[i * 3] = (Math.random() - 0.5) * 9
          positionsArr[i * 3 + 1] = (Math.random() - 0.5) * 6
          positionsArr[i * 3 + 2] = (Math.random() - 0.5) * 5 - 1
        }
        const particleGeometry = new THREE.BufferGeometry()
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positionsArr, 3))
        const particleMaterial = new THREE.PointsMaterial({
          color: accent,
          size: 0.035,
          transparent: true,
          opacity: 0.55,
          sizeAttenuation: true
        })
        const particles = new THREE.Points(particleGeometry, particleMaterial)
        scene.add(particles)

        let pointerX = 0
        let pointerY = 0
        const handlePointerMove = (event: PointerEvent) => {
          const rect = parent.getBoundingClientRect()
          pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2
          pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2
        }
        window.addEventListener('pointermove', handlePointerMove)

        const resize = () => {
          const width = parent.clientWidth
          const height = parent.clientHeight
          if (!width || !height) return
          camera.aspect = width / height
          camera.updateProjectionMatrix()
          renderer.setSize(width, height)
        }
        resize()
        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(parent)

        const themeObserver = new MutationObserver(() => {
          accent = readAccentColor()
          accentLight.color = accent
          particleMaterial.color = accent
          ;(codeLines[0].material as THREE.MeshBasicMaterial).color = accent
        })
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

        const clock = new THREE.Clock()
        let frameId: number

        const animate = () => {
          const elapsed = clock.getElapsedTime()
          rig.rotation.y = Math.sin(elapsed * 0.3) * 0.25 + pointerX * 0.35
          rig.rotation.x = pointerY * 0.15
          rig.position.y = Math.sin(elapsed * 0.8) * 0.08
          codeLines.forEach((line, i) => {
            const mat = line.material as THREE.MeshBasicMaterial
            mat.opacity = line.userData.baseOpacity + Math.sin(elapsed * 1.5 + i) * 0.15
          })
          particles.rotation.y = elapsed * 0.03
          renderer.render(scene, camera)
          frameId = requestAnimationFrame(animate)
        }

        animate()

        teardown = () => {
          if (frameId) cancelAnimationFrame(frameId)
          window.removeEventListener('pointermove', handlePointerMove)
          resizeObserver.disconnect()
          themeObserver.disconnect()
          renderer.dispose()
          particleGeometry.dispose()
          particleMaterial.dispose()
        }
      }

      const handleContextLost = (event: Event) => {
        event.preventDefault()
        teardown?.()
        teardown = null
      }
      const handleContextRestored = () => {
        buildScene()
      }
      canvas.addEventListener('webglcontextlost', handleContextLost, false)
      canvas.addEventListener('webglcontextrestored', handleContextRestored, false)

      buildScene()

      cleanup = () => {
        teardown?.()
        canvas.removeEventListener('webglcontextlost', handleContextLost)
        canvas.removeEventListener('webglcontextrestored', handleContextRestored)
      }
    })()

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  return (
    <div className="developer-scene">
      {displayStack.map((item) => (
        <div key={item.key} className="float-icon" style={{ left: item.left, top: item.top }} aria-hidden="true">
          <div className="float-icon-body" style={{ animationDelay: item.delay }}>
            {item.image ? (
              <img src={item.image} alt={item.label} className="float-image" />
            ) : item.svg ? (
              <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" dangerouslySetInnerHTML={{ __html: item.svg }}></svg>
            ) : (
              <div className="float-fallback">{item.label.slice(0, 2)}</div>
            )}
            <span className="float-label">{item.label}</span>
          </div>
        </div>
      ))}

      <div className="developer-figure">
        <canvas ref={canvasEl} className="developer-canvas" aria-hidden="true"></canvas>
      </div>

      <div className="developer-glow" aria-hidden="true"></div>
    </div>
  )
}
