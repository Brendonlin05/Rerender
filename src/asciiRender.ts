import type { HandCircle } from './WebcamHands'

export const CHAR_SPEED = 0.02

export const CHAR_SETS: Record<string, string[]> = {
  Full: [
    ' ', '.', "'", '^', ',', ':', ';', '!', 'i', 'I', 'l', '|', '\\', '/', '1',
    '[', ']', '(', ')', '?', '-', '_', '+', '~', '<', '>', 't', 'f', 'r', 'j',
    'x', 'v', 'c', 'z', 'n', 'u', 'X', 'Y', 'J', 'C', 'L', 'Q', '0', 'O', 'Z',
    'm', 'w', 'q', 'p', 'd', 'b', 'k', 'h', 'a', 'o', '*', '#', '%', 'W', 'M',
    '&', '8', 'B', '@', '$', '░', '▒', '▓', '▌', '█',
  ],
  Numbers: ['1', '7', '4', '0', '2', '3', '5', '6', '8', '9'],
  Blocks: ['░', '▒', '▓', '▌', '█'],
  Minimal: [' ', '.', ':', '-', '=', '+', '*', '#', '%', '@'],
}

export const DEFAULT_VIDEO_SRC = '/defaultscene.mp4'

export function cyclingChar(phase: number, chars: string[]): string {
  const t = Math.sin(phase) * 0.5 + 0.5
  return chars[Math.floor(t * (chars.length - 1))]
}

export function videoContainRect(
  cw: number,
  ch: number,
  vw: number,
  vh: number,
): { dx: number; dy: number; dw: number; dh: number } | null {
  if (!cw || !ch || !vw || !vh) return null
  const scale = Math.min(cw / vw, ch / vh)
  const dw = vw * scale
  const dh = vh * scale
  return { dx: (cw - dw) / 2, dy: (ch - dh) / 2, dw, dh }
}

export type AsciiGridState = {
  lastCols: number
  lastRows: number
  cellPhase: Float32Array | null
}

export type RenderAsciiOptions = {
  pixelSize: number
  charStyle: string
  pixelBg: boolean
  brandColor: string
  videoSrc: string
  hands: HandCircle[]
  includeHands: boolean
}

/** One ASCII frame: full grid; optional hand reveal overlays when `includeHands`. */
export function renderAsciiFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  video: HTMLVideoElement,
  opts: RenderAsciiOptions,
  work: { off: HTMLCanvasElement; oCtx: CanvasRenderingContext2D },
  grid: AsciiGridState,
): void {
  if (!W || !H || video.readyState < 2) return

  const { pixelSize, charStyle, pixelBg, brandColor, videoSrc, hands, includeHands } = opts
  const vw = video.videoWidth
  const vh = video.videoHeight

  const cols = Math.ceil(W / pixelSize)
  const rows = Math.ceil(H / pixelSize)

  if (cols !== grid.lastCols || rows !== grid.lastRows) {
    work.off.width = cols
    work.off.height = rows
    grid.cellPhase = new Float32Array(cols * rows)
    for (let i = 0; i < grid.cellPhase.length; i++) {
      grid.cellPhase[i] = Math.random() * Math.PI * 2
    }
    grid.lastCols = cols
    grid.lastRows = rows
  }

  const cellPhase = grid.cellPhase!
  const oCtx = work.oCtx
  const useFill = videoSrc === DEFAULT_VIDEO_SRC

  if (useFill) {
    oCtx.drawImage(video, 0, 0, cols, rows)
  } else {
    oCtx.fillStyle = '#000000'
    oCtx.fillRect(0, 0, cols, rows)
    const cellRect = videoContainRect(cols, rows, vw, vh)
    if (cellRect) {
      oCtx.drawImage(video, 0, 0, vw, vh, cellRect.dx, cellRect.dy, cellRect.dw, cellRect.dh)
    } else {
      oCtx.drawImage(video, 0, 0, cols, rows)
    }
  }
  const { data } = oCtx.getImageData(0, 0, cols, rows)

  ctx.font = `${pixelSize}px 'Fira Code', monospace`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  const ps = pixelSize
  const chars = CHAR_SETS[charStyle] ?? CHAR_SETS.Full
  const bgOn = pixelBg

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ci = row * cols + col
      const i = ci * 4
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const bri = (r * 0.299 + g * 0.587 + b * 0.114) / 255
      const x = col * ps
      const y = row * ps

      cellPhase[ci] += CHAR_SPEED
      if (cellPhase[ci] > Math.PI * 2) cellPhase[ci] -= Math.PI * 2

      let ch: string

      if (bgOn) {
        ch = cyclingChar(cellPhase[ci], chars)
        ctx.fillStyle = `rgb(${r},${g},${b})`
      } else {
        ch = chars[Math.floor(bri * (chars.length - 1))]
        const v = Math.round(bri * 255)
        ctx.fillStyle = `rgb(${v},${v},${v})`
      }

      ctx.fillRect(x, y, ps, ps)

          if (ch !== ' ') {
            ctx.fillStyle = brandColor
            ctx.fillText(ch, x, y)
          }
    }
  }

  if (!includeHands) return

  const revealMono = !pixelBg
  for (const { nx, ny, nr } of hands) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(nx * W, ny * H, nr * H, 0, Math.PI * 2)
    ctx.clip()
    if (revealMono) ctx.filter = 'grayscale(1)'
    if (useFill) {
      ctx.drawImage(video, 0, 0, W, H)
    } else {
      const fullRect = videoContainRect(W, H, vw, vh)
      if (fullRect) {
        ctx.drawImage(video, 0, 0, vw, vh, fullRect.dx, fullRect.dy, fullRect.dw, fullRect.dh)
      } else {
        ctx.drawImage(video, 0, 0, W, H)
      }
    }
    ctx.restore()
  }
}
