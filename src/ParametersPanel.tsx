import { useState } from 'react'
import { CHAR_STYLES_ORDER } from './shareParams'

const BRAND_COLORS = ['#C4FDF6', '#FF5B28', '#3ED87D', '#EC6CCD', '#BEA5F6', '#FDFDFD']

interface Props {
  colorIdx:          number
  onColorSelect:     (idx: number) => void
  paused:            boolean
  onTogglePause:     () => void
  pixelSize:         number
  onPixelSizeChange: (v: number) => void
  charStyle:         string
  onCharStyleChange: (s: string) => void
  pixelBg:           boolean
  onPixelBgChange:   (v: boolean) => void
  onUploadClick:     () => void
  onShareClick:      () => void
  shareNotice:       string
}

export default function ParametersPanel({ colorIdx, onColorSelect, paused, onTogglePause, pixelSize, onPixelSizeChange, charStyle, onCharStyleChange, pixelBg, onPixelBgChange, onUploadClick, onShareClick, shareNotice }: Props) {
  const [open, setOpen] = useState(true)

  return (
    <div className="params-panel" onClick={e => e.stopPropagation()}>

      {/* ── Header ── */}
      <div className="params-header" onClick={() => setOpen(o => !o)} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}>
        <span className="params-title">Parameters</span>
        <div
          className="icon-mask-arrow params-chevron"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(180deg)' }}
          aria-hidden="true"
        />
      </div>

      {/* ── Body ── */}
      {open && (
        <div className="params-body">

          {/* Pixel Background */}
          <div className="params-row">
            <span className="params-label">Pixel Background</span>
            <button
              className={`params-toggle-dot${pixelBg ? ' on' : ''}`}
              onClick={() => onPixelBgChange(!pixelBg)}
              aria-label="Toggle pixel background"
            />
          </div>

          {/* Pixel Size — label + value, then full-width slider */}
          <div className="params-slider-block">
            <div className="params-row">
              <span className="params-label">Pixel Size</span>
              <span className="params-value">{pixelSize}</span>
            </div>
            <input
              type="range"
              className="params-slider"
              min={10}
              max={40}
              step={1}
              value={pixelSize}
              onChange={e => onPixelSizeChange(Number(e.target.value))}
            />
          </div>

          {/* Color Style */}
          <div className="params-row">
            <span className="params-label">Color Style</span>
            <div className="params-color-row">
              {BRAND_COLORS.map((hex, i) => (
                <button
                  key={hex}
                  className={`params-color-dot${colorIdx === i ? ' selected' : ''}`}
                  style={{ '--dot-color': hex } as React.CSSProperties}
                  onClick={() => onColorSelect(i)}
                  aria-label={`Color ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Character Style */}
          <div className="params-row params-row-top">
            <span className="params-label">Character Style</span>
            <div className="params-radio-group">
              {CHAR_STYLES_ORDER.map(s => (
                <button
                  key={s}
                  className={`params-radio${charStyle === s ? ' selected' : ''}`}
                  onClick={() => onCharStyleChange(s)}
                >
                  <span className="params-radio-pip" />
                  <span className="params-radio-text">{s}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pause / Resume */}
          <button className="params-pause" onClick={onTogglePause}>
            {paused ? 'Resume' : 'Pause'}
          </button>

          {/* Bottom row */}
          <div className="params-bottom">
            <button
              type="button"
              className="params-upload-btn"
              aria-label="Upload video"
              onClick={e => { e.stopPropagation(); onUploadClick() }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ transform: 'rotate(180deg)' }}>
                <path d="M9 2v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M5 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 16h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              type="button"
              className="params-share"
              onClick={e => { e.stopPropagation(); onShareClick() }}
            >
              Share Parameters
              {shareNotice
                ? <span className="params-share-status">{shareNotice}</span>
                : null}
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
