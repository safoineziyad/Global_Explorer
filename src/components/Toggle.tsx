import type { ReactNode } from 'react'

type ToggleProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  children?: ReactNode
  title?: string
}

export default function Toggle({ checked, onChange, children, title }: ToggleProps) {
  return (
    <label
      title={title}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#eef4ff' }}
    >
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {children}
    </label>
  )
}
