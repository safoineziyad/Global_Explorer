import { useEffect, useSyncExternalStore } from 'react'
import {
  getAtlasServerSnapshot,
  getAtlasSnapshot,
  loadAtlasOnce,
  subscribeAtlas,
  type AtlasState,
} from '../services/atlas'

export type UseAtlasResult = AtlasState

/**
 * Shared atlas accessor.
 *
 * The fetch/decode lives in `services/atlas` so every component subscribes to
 * the same module-level cache instead of issuing its own request. Concurrent
 * mounts dedupe onto one in-flight promise; a warm cache resolves immediately.
 */
export function useAtlas(): UseAtlasResult {
  const state = useSyncExternalStore(subscribeAtlas, getAtlasSnapshot, getAtlasServerSnapshot)

  useEffect(() => {
    // Errors are surfaced through the store; swallow the rejection here so a
    // failed load does not become an unhandled promise rejection.
    void loadAtlasOnce().catch(() => {})
  }, [])

  return state
}

export default useAtlas
