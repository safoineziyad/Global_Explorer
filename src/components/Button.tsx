import type { CSSProperties, ReactNode } from 'react'

type ButtonProps = {
  onClick?: () => void
  children: ReactNode
  title?: string
  style?: CSSProperties
  disabled?: boolean
  type?: 'button' | 'submit'
}

export default function Button({
  onClick,
  children,
  title,
  style,
  disabled = false,
  type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        padding: '0.5rem 1rem',
        border: '1px solid #2c3e56',
        background: '#16212f',
        color: '#eef4ff',
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
