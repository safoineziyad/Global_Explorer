import { useState, type ReactNode } from 'react'

type TooltipProps = {
  content: ReactNode
  children: ReactNode
  className?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
}

const OFFSET = 8

function positionStyle(side: TooltipProps['side']): React.CSSProperties {
  switch (side) {
    case 'bottom':
      return { top: `calc(100% + ${OFFSET}px)`, left: '50%', transform: 'translateX(-50%)' }
    case 'left':
      return { right: `calc(100% + ${OFFSET}px)`, top: '50%', transform: 'translateY(-50%)' }
    case 'right':
      return { left: `calc(100% + ${OFFSET}px)`, top: '50%', transform: 'translateY(-50%)' }
    default:
      return { bottom: `calc(100% + ${OFFSET}px)`, left: '50%', transform: 'translateX(-50%)' }
  }
}

export default function Tooltip({ content, children, className, side = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <span
      className={className}
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && content ? (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 1000,
            padding: '4px 8px',
            borderRadius: 6,
            background: 'rgba(20, 20, 24, 0.95)',
            color: '#fff',
            fontSize: 12,
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            border: '1px solid rgba(255,255,255,0.12)',
            ...positionStyle(side),
          }}
        >
          {content}
        </span>
      ) : null}
    </span>
  )
}
