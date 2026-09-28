import { useEffect, useMemo, useRef } from 'react'
import type * as THREE from 'three'

interface Props {
  stack?: string[]
}

interface TechIcon {
  label: string
  svg: string | null
}

const techIcons: Record<string, TechIcon> = {
  vue: {
    label: 'Vue',
    svg: '<path fill="#41b883" d="M78.8 10.2L64 35.4 49.2 10.2H0l64 110 64-110z"/><path fill="#41b883" d="M78.8 10.2L64 35.4 49.2 10.2H25.6L64 76l38.4-65.8z"/><path fill="#35495e" d="M25.6 10.2L64 76l38.4-65.8H78.8L64 35.4 49.2 10.2z"/>'
  },
  html: {
    label: 'HTML',
    svg: '<path fill="#e34f26" d="M19.037 113.876L9.032 1.661h109.936l-10.016 112.198-45.019 12.48z"/><path fill="#ef652a" d="M64 116.8l36.378-10.086 8.559-96.053H64z"/><path fill="#ebebeb" d="M64 52.455H45.788L44.53 38.361H64V24.599H29.489l.263 2.969 2.693 30.225H64zm0 40.02l-.049.013-11.912-3.22-.761-8.533H39.683l1.499 16.79 21.818 6.051.047-.013z"/><path fill="#fff" d="M63.952 52.455v13.762h16.947l-1.597 17.849-15.35 4.143v14.222l27.947-7.765.208-2.333 3.293-36.833.269-2.966-2.214-.604z"/>'
  },
  css: {
    label: 'CSS',
    svg: '<path fill="#1572b6" d="M8.76 1l10.055 112.883 45.118 12.501 45.244-12.526L119.24 1z"/><path fill="#33a9dc" d="M64 116.8l36.378-10.086 8.559-96.053H64z"/><path fill="#fff" d="M64 52.455H29.499l.827 9.262H64zm0 37.02H43.972l.827 9.263H64z"/><path fill="#ebebeb" d="M64 24.599v13.762h37.59l.319-3.58.758-8.46L64 24.599zM29.499 52.455l.827 9.262H64V52.455zm19.473 37.02l.827 9.263H64v-9.263z"/><path fill="#fff" d="M64 65.997v13.762h33.689l-.285 3.19-.631 7.062L64 89.997zm0-27.398v13.762h36.756l-.285 3.19-.319 3.58H64z"/>'
  },
  js: {
    label: 'JS',
    svg: '<path fill="#f7df1e" d="M1.408 1.408h125.184v125.185H1.408z"/><path fill="#000" d="M116.347 96.736c-.369-2.27-1.875-4.18-3.965-5.725 3.037-1.73 5.25-4.198 5.25-8.465 0-4.552-2.889-7.402-7.514-7.402-5.064 0-7.797 2.562-8.373 6.335l-8.064-1.036c.188-6.636 5.414-11.957 16.572-11.957 10.98 0 16.965 5.064 16.965 12.518 0 6.07-2.985 9.889-7.514 13.123-3.037 2.089-4.847 3.408-5.544 5.725-.369 1.479-.184 2.746.553 3.78 1.106 1.479 3.408 2.271 5.544 2.271 2.562 0 4.658-.738 6.07-2.089 2.271-2.089 2.271-4.847 2.271-5.064h8.064c0 .553.092 4.382-1.291 7.514-1.661 3.408-5.25 5.544-9.889 6.636-4.382 1.106-9.336.553-12.518-1.291-3.408-2.089-5.25-5.25-5.544-9.336zM68.169 82.105c.369 2.27 1.875 4.18 3.965 5.725-2.985 1.73-5.25 4.198-5.25 8.465 0 4.552 2.889 7.402 7.514 7.402 5.064 0 7.797-2.562 8.373-6.335l8.064 1.036c-.188 6.636-5.414 11.957-16.572 11.957-10.98 0-16.965-5.064-16.965-12.518 0-6.07 2.985-9.889 7.514-13.123 3.037-2.089 4.847-3.408 5.544-5.725.369-1.479.184-2.746-.553-3.78-1.106-1.479-3.408-2.271-5.544-2.271-2.562 0-4.658.738-6.07 2.089-2.271 2.089-2.271 4.847-2.271 5.064h-8.064c0-.553-.092-4.382 1.291-7.514 1.661-3.408 5.25-5.544 9.889-6.636 4.382-1.106 9.336-.553 12.518 1.291 3.408 2.089 5.25 5.25 5.544 9.336z"/>'
  },
  react: { label: 'React', svg: null },
  node: { label: 'Node', svg: null },
  typescript: { label: 'TS', svg: null },
  ionic: { label: 'Ionic', svg: null },
  api: { label: 'API', svg: null }
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

const positions = ['pos-0', 'pos-1', 'pos-2', 'pos-3', 'pos-4', 'pos-5']

export default function DeveloperScene({ stack = ['Vue', 'HTML', 'CSS', 'JS'] }: Props) {
  const canvasEl = useRef<HTMLCanvasElement | null>(null)

  const displayStack = useMemo(
    () =>
      (stack || []).slice(0, 6).map((name, i) => {
        const key = normalizeTech(name)
        const tech = key ? techIcons[key] : null
        return {
          key: `${name}-${i}`,
          label: tech ? tech.label : name,
          svg: tech ? tech.svg : null,
          pos: positions[i] || 'pos-0'
        }
      }),
    [stack]
  )

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
        <div key={item.key} className={`float-icon ${item.pos}`} aria-hidden="true">
          {item.svg ? (
            <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" dangerouslySetInnerHTML={{ __html: item.svg }}></svg>
          ) : (
            <div className="float-fallback">{item.label.slice(0, 2)}</div>
          )}
          <span className="float-label">{item.label}</span>
        </div>
      ))}

      <div className="developer-figure">
        <canvas ref={canvasEl} className="developer-canvas" aria-hidden="true"></canvas>
      </div>

      <div className="developer-glow" aria-hidden="true"></div>
    </div>
  )
}
