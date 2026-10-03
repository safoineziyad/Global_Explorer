import Tooltip from './Tooltip'

type ZoomControlsProps = {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset?: () => void
  canZoomIn?: boolean
  canZoomOut?: boolean
  className?: string
}

const buttonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #3a4d66',
  background: '#16212f',
  color: '#ffffff',
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
}

export default function ZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
  canZoomIn = true,
  canZoomOut = true,
  className,
}: ZoomControlsProps) {
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        // Logical inset: mirrors automatically under `dir="rtl"`.
        insetInlineEnd: 16,
        bottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        zIndex: 20,
      }}
    >
      <Tooltip content="Zoom in" side="left">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={onZoomIn}
          disabled={!canZoomIn}
          style={{
            ...buttonStyle,
            borderRadius: '6px 6px 0 0',
            color: canZoomIn ? '#ffffff' : '#6b7a90',
            cursor: canZoomIn ? 'pointer' : 'not-allowed',
          }}
        >
          +
        </button>
      </Tooltip>
      <Tooltip content="Zoom out" side="left">
        <button
          type="button"
          aria-label="Zoom out"
          onClick={onZoomOut}
          disabled={!canZoomOut}
          style={{
            ...buttonStyle,
            borderRadius: '0 0 6px 6px',
            color: canZoomOut ? '#ffffff' : '#6b7a90',
            cursor: canZoomOut ? 'pointer' : 'not-allowed',
          }}
        >
          −
        </button>
      </Tooltip>
      {onReset ? (
        <Tooltip content="Reset view" side="left">
          <button
            type="button"
            aria-label="Reset view"
            onClick={onReset}
            style={{ ...buttonStyle, borderRadius: 6, fontSize: 12 }}
          >
            ⟲
          </button>
        </Tooltip>
      ) : null}
    </div>
  )
}
