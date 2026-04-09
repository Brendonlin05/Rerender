import { useEffect, useRef } from 'react'
import type { HandCircle } from './WebcamHands'
import { renderAsciiFrame, type AsciiGridState } from './asciiRender'

type Props = {
  hands: HandCircle[]
  paused: boolean
  pixelSize: number
  charStyle: string
  pixelBg: boolean
  videoSrc: string
  brandColor: string
}

export default function AsciiRenderer({
  hands,
  paused,
  pixelSize,
  charStyle,
  pixelBg,
  videoSrc,
  brandColor,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoSrcRef = useRef(videoSrc)
  const handsRef = useRef(hands)
  const rafRef = useRef(0)
  const pausedRef = useRef(paused)
  const pixelSizeRef = useRef(pixelSize)
  const charStyleRef = useRef(charStyle)
  const pixelBgRef = useRef(pixelBg)
  const brandColorRef = useRef(brandColor)
  const renderRef = useRef<(() => void) | null>(null)

  useEffect(() => { handsRef.current = hands }, [hands])
  useEffect(() => { videoSrcRef.current = videoSrc }, [videoSrc])
  useEffect(() => { pixelSizeRef.current = pixelSize }, [pixelSize])
  useEffect(() => { charStyleRef.current = charStyle }, [charStyle])
  useEffect(() => { pixelBgRef.current = pixelBg }, [pixelBg])
  useEffect(() => { brandColorRef.current = brandColor }, [brandColor])

  useEffect(() => {
    pausedRef.current = paused
    if (paused) {
      cancelAnimationFrame(rafRef.current)
      videoRef.current?.pause()
    } else {
      videoRef.current?.play().catch(() => {})
      renderRef.current?.()
    }
  }, [paused])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.pause()
    video.srcObject = null
    video.src = videoSrc
    video.loop = true
    video.muted = true
    video.playsInline = true
    video.load()
    if (!pausedRef.current) video.play().catch(() => {})
  }, [videoSrc])

  useEffect(() => {
    const video = videoRef.current!
    const canvas = canvasRef.current!
    const off = document.createElement('canvas')
    const oCtx = off.getContext('2d', { willReadFrequently: true })!
    const work = { off, oCtx }
    const grid: AsciiGridState = { lastCols: 0, lastRows: 0, cellPhase: null }

    const ro = new ResizeObserver(() => {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
    })
    ro.observe(canvas)
    canvas.width = canvas.clientWidth || 800
    canvas.height = canvas.clientHeight || 600

    function render() {
      if (pausedRef.current) return

      const W = canvas.width
      const H = canvas.height

      if (!W || !H || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(render)
        return
      }

      const ctx = canvas.getContext('2d')!
      renderAsciiFrame(
        ctx,
        W,
        H,
        video,
        {
          pixelSize: pixelSizeRef.current,
          charStyle: charStyleRef.current,
          pixelBg: pixelBgRef.current,
          brandColor: brandColorRef.current,
          videoSrc: videoSrcRef.current,
          hands: handsRef.current,
          includeHands: true,
        },
        work,
        grid,
      )

      rafRef.current = requestAnimationFrame(render)
    }

    renderRef.current = render
    render()

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      video.pause()
      video.src = ''
    }
  }, [])

  return (
    <>
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
      <canvas ref={canvasRef} className="ascii-canvas" />
    </>
  )
}
