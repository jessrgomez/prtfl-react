import { useSyncExternalStore } from 'react'

export interface LaunchPoint {
  x: number
  y: number
}

interface BuddyState {
  active: boolean
  // Where the car drops in from (the bottom centre of the nav button).
  from: LaunchPoint | null
}

// Module-level singleton store, like useTheme: the nav button switches the
// F1 Buddy on and off, and the car itself reads the same state.
let state: BuddyState = { active: false, from: null }
const listeners = new Set<() => void>()

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function getSnapshot() {
  return state
}

function setState(next: BuddyState) {
  state = next
  listeners.forEach((listener) => listener())
}

// For the car's animation loop, which checks the switch every frame outside React.
export const getF1Buddy = getSnapshot

export function useF1Buddy() {
  const buddy = useSyncExternalStore(subscribe, getSnapshot)

  const launch = (from: LaunchPoint) => setState({ active: true, from })
  const park = () => setState({ ...state, active: false })

  return { ...buddy, launch, park }
}
