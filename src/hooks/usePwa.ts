import { useSyncExternalStore } from 'react'
import {
  getPwaServerSnapshot,
  getPwaSnapshot,
  subscribePwa,
  type PwaState,
} from '../services/pwa'

export type UsePwaResult = PwaState

/**
 * Subscribes to the shared PWA store (install prompt, standalone display mode,
 * worker updates) so components do not each attach their own listeners.
 */
export function usePwa(): UsePwaResult {
  return useSyncExternalStore(subscribePwa, getPwaSnapshot, getPwaServerSnapshot)
}

export default usePwa