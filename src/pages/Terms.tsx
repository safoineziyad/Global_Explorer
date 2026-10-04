import { Link } from 'react-router-dom'
import { useT } from '../i18n'

/**
 * Terms of Use (audit-terms).
 *
 * Static, plain-language terms for a client-side atlas. New strings are
 * requested from W10; English fallbacks keep the page substantive until the
 * translations land.
 */

const LAST_UPDATED = '2026-10-03'

const linkStyle = { color: '#9fc6f0', textDecoration: 'none' } as const
const paragraphStyle = { margin: '0 0 0.85rem', color: '#c7d5e6', lineHeight: 1.7 } as const
const headingStyle = { margin: '1.5rem 0 0.6rem', color: '#eef4ff', fontSize: '1.1rem' } as const

export default function Terms() {
  const t = useT()
  const tx = (key: string, fallback: string, params?: Record<string, string | number>): string => {
    const value = t(key)
    const template = value === key ? fallback : value
    if (!params) return template
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      params[name] === undefined ? match : String(params[name])
    )
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0b111c',
        color: '#eef4ff',
        padding: '1.5rem 1rem 3rem',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link to="/" style={{ ...linkStyle, fontSize: '0.85rem' }}>
          ← {t('errors.backHome')}
        </Link>

        <h1 style={{ margin: '0.75rem 0 0.25rem', fontSize: '1.8rem' }}>
          {tx('legal.terms.title', 'Terms of Use')}
        </h1>
        <p style={{ margin: 0, color: '#8fa3bd', fontSize: '0.85rem' }}>
          {tx('legal.terms.updated', 'Last updated: {date}', { date: LAST_UPDATED })}
        </p>

        <p style={{ ...paragraphStyle, marginTop: '1.25rem' }}>
          {tx(
            'legal.terms.intro',
            'These terms govern your use of Global Explorer. By opening or using the app you agree to them. If you do not agree, please do not use the app.'
          )}
        </p>

        <h2 style={headingStyle}>{tx('legal.terms.acceptance.title', 'Acceptance of these terms')}</h2>
        <p style={paragraphStyle}>
          {tx(
            'legal.terms.acceptance.body',
            'By accessing or using Global Explorer you confirm that you have read and accepted these terms. If you use the app on behalf of an organisation, you confirm that you have authority to accept them for that organisation.'
          )}
        </p>

        <h2 style={headingStyle}>{tx('legal.terms.use.title', 'Permitted use')}</h2>
        <p style={paragraphStyle}>
          {tx(
            'legal.terms.use.body',
            'Global Explorer is provided for personal, educational and informational use. You agree not to use it unlawfully, not to attempt to disrupt or overload it, not to scrape it abusively, and not to present its contents as official or authoritative data.'
          )}
        </p>

        <h2 style={headingStyle}>{tx('legal.terms.content.title', 'Content and data')}</h2>
        <p style={paragraphStyle}>
          {tx(
            'legal.terms.content.body',
            'Country facts, boundaries, flags and place descriptions come from third-party sources and may contain errors, omissions or become outdated. Always verify important information — especially anything you rely on for travel, legal or safety decisions — against official sources.'
          )}
        </p>

        <h2 style={headingStyle}>{tx('legal.terms.accuracy.title', 'No warranty')}</h2>
        <p style={paragraphStyle}>
          {tx(
            'legal.terms.accuracy.body',
            'The application is provided “as is” and “as available”, without warranties of any kind, express or implied, including but not limited to accuracy, completeness, fitness for a particular purpose and non-infringement.'
          )}
        </p>

        <h2 style={headingStyle}>{tx('legal.terms.liability.title', 'Limitation of liability')}</h2>
        <p style={paragraphStyle}>
          {tx(
            'legal.terms.liability.body',
            'To the maximum extent permitted by applicable law, the authors and contributors of Global Explorer are not liable for any loss or damage arising from your use of, or inability to use, the application or its data.'
          )}
        </p>

        <h2 style={headingStyle}>{tx('legal.terms.intellectual.title', 'Intellectual property')}</h2>
        <p style={paragraphStyle}>
          {tx(
            'legal.terms.intellectual.body',
            'The application code is open source under the terms of its repository license. Third-party datasets, map geometry and flag images remain the property of their respective providers and are used under their own terms. The “Natural Earth”, “REST Countries” and “flagcdn” names belong to their owners.'
          )}
        </p>

        <h2 style={headingStyle}>{tx('legal.terms.changes.title', 'Changes to these terms')}</h2>
        <p style={paragraphStyle}>
          {tx(
            'legal.terms.changes.body',
            'These terms may be updated from time to time. The “last updated” date above will reflect the latest revision, and continued use after a change means you accept the updated terms.'
          )}
        </p>

        <h2 style={headingStyle}>{tx('legal.terms.contact.title', 'Contact')}</h2>
        <p style={paragraphStyle}>
          {tx(
            'legal.terms.contact.body',
            'For questions about these terms, please open an issue in the project repository, or use the contact link in the footer.'
          )}
        </p>

        <p style={{ marginTop: '1.5rem', color: '#8fa3bd', fontSize: '0.85rem' }}>
          {t('footer.privacy')}:{' '}
          <Link to="/privacy" style={linkStyle}>
            {tx('legal.privacy.title', 'Privacy Policy')}
          </Link>
        </p>
      </div>
    </main>
  )
}
