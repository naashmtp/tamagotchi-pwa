import { useEffect } from 'react'
import { usePetStore } from '../store/petStore'

const TICK_INTERVAL_MS = 60 * 1000

export function useDecayLoop() {
  const tickDecay = usePetStore((s) => s.tickDecay)

  useEffect(() => {
    tickDecay() // apply offline decay immediately on mount
    const interval = setInterval(tickDecay, TICK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [tickDecay])
}
