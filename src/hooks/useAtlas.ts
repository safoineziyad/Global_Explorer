import { useEffect, useState } from 'react'
import type { Atlas } from '../types'

const ATLAS_URL = '/data/countries-110m.json'

export type UseAtlasResult = {
  atlas: Atlas | null
  loading: boolean
  error: string | null
}

export function useAtlas(): UseAtlasResult {
  const [atlas, setAtlas] = useState<Atlas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadAtlas() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(ATLAS_URL)
        if (!response.ok) {
          throw new Error(`Failed to load atlas: ${response.status} ${response.statusText}`)
        }

        const data = (await response.json()) as Atlas
        if (mounted) {
          setAtlas(data)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load atlas')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadAtlas()

    return () => {
      mounted = false
    }
  }, [])

  return { atlas, loading, error }
}

export default useAtlas
