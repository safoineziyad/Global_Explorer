import type { CSSProperties } from 'react'

/** Shared inline styles for the additive explorer panels. */
export const actionStyle: CSSProperties = {
  padding: '0.4rem 0.7rem',
  border: '1px solid #2c3e56',
  background: '#16212f',
  color: '#eef4ff',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: '0.8rem',
}

export const primaryActionStyle: CSSProperties = {
  ...actionStyle,
  border: '1px solid #3b82f6',
  background: '#1d3a63',
  fontWeight: 600,
}

export const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '0.25rem 0.5rem',
  border: '1px solid #243247',
  background: '#101a2b',
  color: '#c7d5e8',
  borderRadius: 999,
  cursor: 'pointer',
  fontSize: '0.72rem',
}

export const cardStyle: CSSProperties = {
  border: '1px solid #1f2c3f',
  borderRadius: 8,
  padding: '0.5rem 0.6rem',
  background: '#101a2b',
}

export const subtleTextStyle: CSSProperties = {
  color: '#8fa3bd',
  fontSize: '0.78rem',
}
