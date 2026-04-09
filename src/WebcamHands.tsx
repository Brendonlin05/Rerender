import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    Hands: any
  }
}

export interface HandCircle {
  nx: number  // normalized x 0-1 (already mirrored)
  ny: number  // normalized y 0-1
  nr: number  // radius / canvas height
}

const PALM_IDS = [0, 1, 5, 9, 13, 17]
const FINGERTIP_IDS = [4, 8, 12, 16, 20]
const CONTOUR_POINTS = 48
const MAX_HANDS = 6

const HAND_CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17],
]

const COLORS = ['#C4FDF6', '#FF5B28', '#3ED87D', '#EC6CCD', '#BEA5F6', '#FDFDFD']

function mirrorX(x: number, w: number) {
  return (1 - x) * w
}

function drawHands(
  results: any,
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  w: number,
  h: number,
): HandCircle[] {
  const circles: HandCircle[] = []
  ctx.save()
  ctx.translate(w, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(video, 0, 0, w, h)
  ctx.restore()

  if (!results.multiHandLandmarks?.length) {
    ctx.fillStyle = 'rgba(180,180,180,0.7)'
    ctx.font = '11px Fira Code, monospace'
    ctx.fillText(`hands:0/${MAX_HANDS}  pts:${CONTOUR_POINTS}`, 10, 20)
    return circles
  }

  for (let idx = 0; idx < results.multiHandLandmarks.length; idx++) {
    const landmarks: { x: number; y: number }[] = results.multiHandLandmarks[idx]
    const color = COLORS[idx % COLORS.length]

    ctx.strokeStyle = color
    ctx.lineWidth = 6
    for (const [a, b] of HAND_CONNECTIONS) {
      const la = landmarks[a], lb = landmarks[b]
      ctx.beginPath()
      ctx.moveTo(mirrorX(la.x, w), la.y * h)
      ctx.lineTo(mirrorX(lb.x, w), lb.y * h)
      ctx.stroke()
    }

    ctx.fillStyle = color
    for (const lm of landmarks) {
      ctx.beginPath()
      ctx.arc(mirrorX(lm.x, w), lm.y * h, 8, 0, Math.PI * 2)
      ctx.fill()
    }

    let cx = 0, cy = 0
    for (const i of PALM_IDS) {
      cx += mirrorX(landmarks[i].x, w)
      cy += landmarks[i].y * h
    }
    cx /= PALM_IDS.length
    cy /= PALM_IDS.length

    let radius = 0
    for (const i of FINGERTIP_IDS) {
      radius += Math.hypot(mirrorX(landmarks[i].x, w) - cx, landmarks[i].y * h - cy)
    }
    radius /= FINGERTIP_IDS.length

    circles.push({ nx: cx / w, ny: cy / h, nr: radius / h })

    ctx.strokeStyle = color
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = color
    for (let p = 0; p < CONTOUR_POINTS; p++) {
      const angle = (p / CONTOUR_POINTS) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, 6, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = '#00C8FF'
    ctx.beginPath()
    ctx.arc(cx, cy, 12, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = color
    ctx.font = 'bold 13px Fira Code, monospace'
    ctx.fillText(`H${idx}`, cx + 10, cy - 10)
  }

  const handCount = results.multiHandLandmarks.length
  ctx.fillStyle = 'rgba(180,180,180,0.7)'
  ctx.font = '11px Fira Code, monospace'
  ctx.fillText(`hands:${handCount}/${MAX_HANDS}  pts:${CONTOUR_POINTS}`, 10, 20)

  return circles
}

type CamState = 'idle' | 'loading' | 'active' | 'error'

interface Props {
  onHandsUpdate?: (hands: HandCircle[]) => void
}

export default function WebcamHands({ onHandsUpdate }: Props) {
  const videoRef           = useRef<HTMLVideoElement>(null)
  const canvasRef          = useRef<HTMLCanvasElement>(null)
  const handsRef           = useRef<any>(null)
  const rafRef             = useRef<number>(0)
  const streamRef          = useRef<MediaStream | null>(null)
  const cancelledRef       = useRef(false)
  const processingRef      = useRef(false)
  const resultsRef         = useRef<any>(null)
  const onHandsUpdateRef   = useRef(onHandsUpdate)
  const [camState, setCamState] = useState<CamState>('idle')

  useEffect(() => { onHandsUpdateRef.current = onHandsUpdate }, [onHandsUpdate])

  // Cleanup on unmount
  useEffect(() => {
    return () => { teardown() }
  }, [])

  function teardown() {
    cancelledRef.current = true
    cancelAnimationFrame(rafRef.current)
    handsRef.current?.close()
    handsRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    resultsRef.current = null
    processingRef.current = false
    const video = videoRef.current
    if (video?.srcObject) { video.srcObject = null }
    onHandsUpdateRef.current?.([])
  }

  async function openCamera() {
    if (camState === 'loading' || camState === 'active') return
    cancelledRef.current = false
    onHandsUpdateRef.current?.([])
    setCamState('loading')

    // Wait for MediaPipe CDN
    let waited = 0
    while (!window.Hands) {
      if (waited > 10000) { setCamState('error'); return }
      await new Promise(r => setTimeout(r, 100))
      waited += 100
    }
    if (cancelledRef.current) return

    // Request webcam in 16:9
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, aspectRatio: { ideal: 16 / 9 } },
      })
    } catch {
      if (!cancelledRef.current) {
        onHandsUpdateRef.current?.([])
        setCamState('error')
      }
      return
    }
    if (cancelledRef.current) { stream.getTracks().forEach(t => t.stop()); return }

    streamRef.current = stream
    const video = videoRef.current!
    video.srcObject = stream
    await video.play()
    if (cancelledRef.current) { teardown(); return }

    const canvas = canvasRef.current!
    canvas.width  = video.videoWidth  || 1280
    canvas.height = video.videoHeight || 720

    const hands = new window.Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    })
    hands.setOptions({
      maxNumHands: MAX_HANDS,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })
    hands.onResults((r: any) => {
      resultsRef.current = r
      processingRef.current = false
    })
    handsRef.current = hands

    setCamState('active')

    async function loop() {
      if (cancelledRef.current) return
      if (!processingRef.current && video.readyState >= 2) {
        processingRef.current = true
        try { await hands.send({ image: video }) } catch { processingRef.current = false }
      }
      const ctx = canvas.getContext('2d')
      if (ctx && resultsRef.current) {
        const circles = drawHands(resultsRef.current, ctx, video, canvas.width, canvas.height)
        onHandsUpdateRef.current?.(circles)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    loop()
  }

  function closeCamera() {
    teardown()
    setCamState('idle')
  }

  return (
    <div className="webcam-wrapper" onClick={e => e.stopPropagation()}>
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />

      {/* Top bar — only when camera is active */}
      {camState === 'active' && (
        <div className="webcam-topbar">
          <button className="webcam-close-btn" onClick={closeCamera} aria-label="Close camera">
            ✕
          </button>
        </div>
      )}

      {/* 16:9 camera body */}
      <div className="webcam-body">
        {/* Default / error state */}
        {(camState === 'idle' || camState === 'error') && (
          <div className="webcam-prompt">
            <p className="webcam-prompt-text">
              {camState === 'error'
                ? 'Camera unavailable'
                : 'Open camera to play with ASCII memory'}
            </p>
            <button className="webcam-open-btn" onClick={openCamera}>
              {camState === 'error' ? 'Retry' : 'Open Camera'}
            </button>
          </div>
        )}

        {/* Loading state */}
        {camState === 'loading' && (
          <div className="webcam-prompt">
            <p className="webcam-prompt-text">loading camera…</p>
          </div>
        )}

        {/* Live canvas */}
        <canvas
          ref={canvasRef}
          className="webcam-canvas"
          style={{ display: camState === 'active' ? 'block' : 'none' }}
        />
      </div>
    </div>
  )
}
