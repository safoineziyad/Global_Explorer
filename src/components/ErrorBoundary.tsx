import { Component, type ErrorInfo, type ReactNode } from 'react'
import { detectLocale, translate } from '../i18n'

type ErrorBoundaryProps = {
  children: ReactNode
  /** Optional custom fallback; receives a reload handler. */
  fallback?: (reload: () => void) => ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

/**
 * Catches render/lifecycle errors anywhere below it and shows a friendly,
 * translated fallback with a reload action instead of a blank screen.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No telemetry by design; log locally so the failure is diagnosable.
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback(this.handleReload)

    // This boundary can sit outside I18nProvider, so resolve strings directly.
    const t = (key: string) => translate(detectLocale(), key)

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#0b111c',
          color: '#eef4ff',
          padding: '2rem',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <p style={{ fontSize: '3rem', margin: 0 }} aria-hidden>
            🧭
          </p>
          <h1 style={{ margin: '0.5rem 0' }}>{t('errors.generic')}</h1>
          <p style={{ color: '#8fa3bd', marginBottom: '1.5rem' }}>{t('errors.unknown')}</p>
          <button type="button" onClick={this.handleReload} style={{ marginInlineEnd: '0.75rem' }}>
            {t('pwa.reload')}
          </button>
          <a href="/" style={{ color: '#7cc0ff' }}>
            {t('errors.backHome')}
          </a>
        </div>
      </div>
    )
  }
}
