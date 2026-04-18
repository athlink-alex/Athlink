import { useEffect, useRef } from 'react'

interface HeroBackgroundProps {
  isDark: boolean
}

/* ── Easing ── */

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

/* ── Color helper ── */

function makeColor(isDark: boolean) {
  return (opacity: number) =>
    isDark
      ? `rgba(255, 255, 255, ${opacity})`
      : `rgba(37, 99, 235, ${opacity})`
}

/* ── Coastline path (percentage-based) ── */

interface CoastSegment {
  cp1x: number; cp1y: number; cp2x: number; cp2y: number; x: number; y: number
}

const COAST_START = { x: 0.12, y: 0.08 }

const COAST_SEGS: CoastSegment[] = [
  { cp1x: 0.13, cp1y: 0.14, cp2x: 0.16, cp2y: 0.19, x: 0.18, y: 0.22 },
  { cp1x: 0.20, cp1y: 0.28, cp2x: 0.21, cp2y: 0.33, x: 0.22, y: 0.38 },
  { cp1x: 0.23, cp1y: 0.46, cp2x: 0.21, cp2y: 0.50, x: 0.20, y: 0.55 },
  { cp1x: 0.19, cp1y: 0.62, cp2x: 0.22, cp2y: 0.67, x: 0.24, y: 0.72 },
  { cp1x: 0.26, cp1y: 0.79, cp2x: 0.28, cp2y: 0.84, x: 0.30, y: 0.88 },
]

const CITY_DOTS = [
  { x: 0.16, y: 0.18, name: 'El Segundo' },
  { x: 0.21, y: 0.34, name: 'Manhattan Beach' },
  { x: 0.21, y: 0.50, name: 'Hermosa Beach' },
  { x: 0.21, y: 0.64, name: 'Redondo Beach' },
  { x: 0.26, y: 0.78, name: 'Torrance' },
]

/* ── Diamond geometry ── */

const DIAMOND_CENTER = { x: 0.65, y: 0.50 }
const DIAMOND_H_W = 0.18  // half-width as % of canvas width
const DIAMOND_H_H = 0.22  // half-height as % of canvas height

/* ── Draw helpers ── */

function traceCoastPath(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.beginPath()
  ctx.moveTo(COAST_START.x * w, COAST_START.y * h)
  for (const s of COAST_SEGS) {
    ctx.bezierCurveTo(s.cp1x * w, s.cp1y * h, s.cp2x * w, s.cp2y * h, s.x * w, s.y * h)
  }
}

function traceDiamondBases(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = DIAMOND_CENTER.x * w
  const cy = DIAMOND_CENTER.y * h
  const hw = DIAMOND_H_W * w
  const hh = DIAMOND_H_H * h

  const bases = [
    { x: cx, y: cy + hh },      // home
    { x: cx + hw, y: cy },      // first
    { x: cx, y: cy - hh },      // second
    { x: cx - hw, y: cy },      // third
  ]

  const segs: { x0: number; y0: number; x1: number; y1: number }[] = []
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4
    segs.push({ x0: bases[i].x, y0: bases[i].y, x1: bases[next].x, y1: bases[next].y })
  }

  ctx.beginPath()
  ctx.moveTo(segs[0].x0, segs[0].y0)
  for (const s of segs) {
    ctx.lineTo(s.x1, s.y1)
  }
  ctx.closePath()
}

function traceInfieldArc(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = DIAMOND_CENTER.x * w
  const cy = DIAMOND_CENTER.y * h
  const hh = DIAMOND_H_H * h

  ctx.beginPath()
  ctx.arc(cx, cy + hh * 0.65, Math.min(DIAMOND_H_W * w, DIAMOND_H_H * h) * 0.55, Math.PI * 1.15, Math.PI * 1.85)
}

/* ── Approximate path lengths for dash offset ── */

function approxCoastLength(w: number, h: number): number {
  let len = 0
  let px = COAST_START.x * w, py = COAST_START.y * h
  for (const s of COAST_SEGS) {
    const ex = s.x * w, ey = s.y * h
    len += Math.sqrt((ex - px) ** 2 + (ey - py) ** 2) * 1.4
    px = ex; py = ey
  }
  return len
}

function approxDiamondPerimeter(w: number, h: number): number {
  const hw = DIAMOND_H_W * w
  const hh = DIAMOND_H_H * h
  return 4 * Math.sqrt(hw * hw + hh * hh)
}

function approxArcLength(w: number, h: number): number {
  const r = Math.min(DIAMOND_H_W * w, DIAMOND_H_H * h) * 0.55
  return r * 0.7 * Math.PI // ~70% of circumference
}

/* ── Static draw (reduced motion fallback) ── */

function drawStatic(ctx: CanvasRenderingContext2D, w: number, h: number, isDark: boolean) {
  const c = makeColor(isDark)
  ctx.clearRect(0, 0, w, h)

  // Coastline
  traceCoastPath(ctx, w, h)
  ctx.strokeStyle = c(0.18)
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.setLineDash([])
  ctx.stroke()

  // City dots
  ctx.font = '9px Inter, system-ui, sans-serif'
  for (const dot of CITY_DOTS) {
    const dx = dot.x * w, dy = dot.y * h
    ctx.beginPath()
    ctx.arc(dx, dy, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = c(0.5)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(dx, dy)
    ctx.lineTo(dx + 20, dy)
    ctx.strokeStyle = c(0.3)
    ctx.lineWidth = 0.8
    ctx.stroke()
    ctx.fillStyle = c(0.3)
    ctx.fillText(dot.name, dx + 26, dy + 3)
  }

  // Diamond bases
  traceDiamondBases(ctx, w, h)
  ctx.strokeStyle = c(0.08)
  ctx.lineWidth = 1.2
  ctx.setLineDash([])
  ctx.stroke()

  // Infield arc
  traceInfieldArc(ctx, w, h)
  ctx.strokeStyle = c(0.05)
  ctx.lineWidth = 1
  ctx.stroke()

  // Base squares
  const cx = DIAMOND_CENTER.x * w
  const cy = DIAMOND_CENTER.y * h
  const hw = DIAMOND_H_W * w
  const hh = DIAMOND_H_H * h
  const bases = [
    { x: cx, y: cy + hh },
    { x: cx + hw, y: cy },
    { x: cx, y: cy - hh },
    { x: cx - hw, y: cy },
  ]
  for (const b of bases) {
    ctx.save()
    ctx.translate(b.x, b.y)
    ctx.rotate(Math.PI / 4)
    ctx.fillStyle = c(0.15)
    ctx.fillRect(-5, -5, 10, 10)
    ctx.restore()
  }

  // Pitcher's mound
  ctx.beginPath()
  ctx.arc(cx, cy, 10, 0, Math.PI * 2)
  ctx.fillStyle = c(0.06)
  ctx.fill()
  ctx.strokeStyle = c(0.12)
  ctx.lineWidth = 1
  ctx.stroke()

  // Glow
  ctx.save()
  ctx.shadowColor = c(0.8)
  ctx.shadowBlur = 6
  traceCoastPath(ctx, w, h)
  ctx.strokeStyle = c(0.06)
  ctx.lineWidth = 1.5
  ctx.stroke()
  traceDiamondBases(ctx, w, h)
  ctx.strokeStyle = c(0.06)
  ctx.lineWidth = 1.2
  ctx.stroke()
  ctx.restore()
}

/* ── Animated sequence ── */

function startAnimation(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isDark: boolean,
  animRef: React.MutableRefObject<number | undefined>,
  timersRef: React.MutableRefObject<ReturnType<typeof setTimeout>[]>
) {
  const c = makeColor(isDark)
  const coastLen = approxCoastLength(w, h)
  const diamondLen = approxDiamondPerimeter(w, h)
  const arcLen = approxArcLength(w, h)

  const COAST_DURATION = 1800
  const DIAMOND_DELAY = 600
  const DIAMOND_DURATION = 1000
  const ARC_DURATION = 600
  const ARC_DELAY = DIAMOND_DELAY + DIAMOND_DURATION
  const BASE_DURATION = 200
  const BASE_STAGGER = 100
  const MOUND_DELAY = ARC_DELAY + ARC_DURATION + BASE_DURATION * 4 + BASE_STAGGER * 3 + 100

  let startTime: number | null = null
  let glowOpacity = 0
  let dotOpacitys = [0, 0, 0, 0, 0]
  let baseOpacitys = [0, 0, 0, 0]
  let moundOpacity = 0

  // City dot appearance schedule: after coast finishes
  const coastFinishTime = COAST_DURATION
  const DOT_FADE_DURATION = 300
  const DOT_STAGGER = 120
  const DOT_PULSE_DELAY = coastFinishTime + DOT_FADE_DURATION + DOT_STAGGER * 4 + 100
  const DOT_PULSE_DURATION = 400

  const cx = DIAMOND_CENTER.x * w
  const cy = DIAMOND_CENTER.y * h
  const hw = DIAMOND_H_W * w
  const hh = DIAMOND_H_H * h
  const bases = [
    { x: cx, y: cy + hh },
    { x: cx + hw, y: cy },
    { x: cx, y: cy - hh },
    { x: cx - hw, y: cy },
  ]

  function frame(now: number) {
    if (startTime === null) startTime = now
    const elapsed = now - startTime

    ctx.clearRect(0, 0, w, h)

    /* ── Coastline ── */
    const coastProgress = Math.min(1, elapsed / COAST_DURATION)
    const coastEased = easeInOut(coastProgress)
    const coastOffset = coastLen * (1 - coastEased)

    ctx.save()
    traceCoastPath(ctx, w, h)
    ctx.setLineDash([coastLen])
    ctx.lineDashOffset = coastOffset
    ctx.strokeStyle = c(0.12)
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.restore()

    // After fully drawn, draw again at higher opacity
    if (coastProgress >= 1) {
      ctx.save()
      traceCoastPath(ctx, w, h)
      ctx.setLineDash([])
      ctx.strokeStyle = c(0.18)
      ctx.lineWidth = 1.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      ctx.restore()
    }

    /* ── City dots ── */
    ctx.font = '9px Inter, system-ui, sans-serif'
    for (let i = 0; i < CITY_DOTS.length; i++) {
      const dotStart = coastFinishTime + i * DOT_STAGGER
      if (elapsed >= dotStart) {
        const dotElapsed = elapsed - dotStart
        let opacity = Math.min(1, dotElapsed / DOT_FADE_DURATION)
        let scale = 1

        // Pulse effect
        const pulseStart = DOT_PULSE_DELAY + i * DOT_STAGGER
        if (elapsed >= pulseStart) {
          const pulseElapsed = elapsed - pulseStart
          if (pulseElapsed < DOT_PULSE_DURATION) {
            const pulseT = pulseElapsed / DOT_PULSE_DURATION
            scale = pulseT < 0.5 ? 1 + 0.5 * easeInOut(pulseT * 2) : 1.5 - 0.5 * easeInOut((pulseT - 0.5) * 2)
          }
        }

        const dx = CITY_DOTS[i].x * w
        const dy = CITY_DOTS[i].y * h
        const r = 3.5 * scale

        ctx.beginPath()
        ctx.arc(dx, dy, r, 0, Math.PI * 2)
        ctx.fillStyle = c(0.5 * opacity)
        ctx.fill()

        // Tick line
        ctx.beginPath()
        ctx.moveTo(dx, dy)
        ctx.lineTo(dx + 20 * opacity, dy)
        ctx.strokeStyle = c(0.3 * opacity)
        ctx.lineWidth = 0.8
        ctx.setLineDash([])
        ctx.stroke()

        // Label
        ctx.fillStyle = c(0.3 * opacity)
        ctx.fillText(CITY_DOTS[i].name, dx + 26, dy + 3)
      }
    }

    /* ── Diamond base paths ── */
    const diamondElapsed = elapsed - DIAMOND_DELAY
    if (diamondElapsed > 0) {
      const diamondProgress = Math.min(1, diamondElapsed / DIAMOND_DURATION)
      const diamondEased = easeInOut(diamondProgress)
      const diamondOffset = diamondLen * (1 - diamondEased)

      ctx.save()
      traceDiamondBases(ctx, w, h)
      ctx.setLineDash([diamondLen])
      ctx.lineDashOffset = diamondOffset
      ctx.strokeStyle = c(0.08)
      ctx.lineWidth = 1.2
      ctx.stroke()
      ctx.restore()

      if (diamondProgress >= 1) {
        ctx.save()
        traceDiamondBases(ctx, w, h)
        ctx.setLineDash([])
        ctx.strokeStyle = c(0.08)
        ctx.lineWidth = 1.2
        ctx.stroke()
        ctx.restore()
      }
    }

    /* ── Infield arc ── */
    const arcElapsed = elapsed - ARC_DELAY
    if (arcElapsed > 0) {
      const arcProgress = Math.min(1, arcElapsed / ARC_DURATION)
      const arcEased = easeInOut(arcProgress)
      const arcOffset = arcLen * (1 - arcEased)

      ctx.save()
      traceInfieldArc(ctx, w, h)
      ctx.setLineDash([arcLen])
      ctx.lineDashOffset = arcOffset
      ctx.strokeStyle = c(0.05)
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.restore()

      if (arcProgress >= 1) {
        traceInfieldArc(ctx, w, h)
        ctx.setLineDash([])
        ctx.strokeStyle = c(0.05)
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    /* ── Base squares ── */
    for (let i = 0; i < 4; i++) {
      const baseStart = ARC_DELAY + ARC_DURATION + i * BASE_STAGGER
      if (elapsed >= baseStart) {
        const bOp = Math.min(1, (elapsed - baseStart) / BASE_DURATION)
        ctx.save()
        ctx.translate(bases[i].x, bases[i].y)
        ctx.rotate(Math.PI / 4)
        ctx.fillStyle = c(0.15 * bOp)
        ctx.fillRect(-5, -5, 10, 10)
        ctx.restore()
      }
    }

    /* ── Pitcher's mound ── */
    if (elapsed >= MOUND_DELAY) {
      const mOp = Math.min(1, (elapsed - MOUND_DELAY) / 300)
      ctx.beginPath()
      ctx.arc(cx, cy, 10, 0, Math.PI * 2)
      ctx.fillStyle = c(0.06 * mOp)
      ctx.fill()
      ctx.strokeStyle = c(0.12 * mOp)
      ctx.lineWidth = 1
      ctx.setLineDash([])
      ctx.stroke()
    }

    /* ── Glow ── */
    const GLOW_START = MOUND_DELAY + 300 + 800 // 0.8s fade
    if (elapsed >= GLOW_START) {
      glowOpacity = Math.min(1, (elapsed - GLOW_START) / 800)
    }
    if (glowOpacity > 0 && coastProgress >= 1 && (diamondElapsed <= 0 || Math.min(1, diamondElapsed / DIAMOND_DURATION) >= 1)) {
      ctx.save()
      ctx.shadowColor = c(0.8)
      ctx.shadowBlur = 6 * glowOpacity
      traceCoastPath(ctx, w, h)
      ctx.setLineDash([])
      ctx.strokeStyle = c(0.06 * glowOpacity)
      ctx.lineWidth = 1.5
      ctx.stroke()
      traceDiamondBases(ctx, w, h)
      ctx.setLineDash([])
      ctx.strokeStyle = c(0.06 * glowOpacity)
      ctx.lineWidth = 1.2
      ctx.stroke()
      ctx.restore()
    }

    // Continue if any animation still active
    const allDone = elapsed > GLOW_START + 800 + 200
    if (!allDone) {
      animRef.current = requestAnimationFrame(frame)
    }
  }

  animRef.current = requestAnimationFrame(frame)
}

/* ── Component ── */

export default function HeroBackground({ isDark }: HeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | undefined>(undefined)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (!rect) return
      const dpr = window.devicePixelRatio || 1
      w = rect.width
      h = rect.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) {
      drawStatic(ctx, w, h, isDark)
      return
    }

    // Wait 400ms then start animation
    const t = setTimeout(() => {
      resize()
      startAnimation(ctx, w, h, isDark, animRef, timersRef)
    }, 400)
    timersRef.current.push(t)

    const handleResize = () => {
      if (animRef.current !== undefined) cancelAnimationFrame(animRef.current)
      resize()
      // On resize, redraw at current state statically for simplicity
      drawStatic(ctx, w, h, isDark)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      if (animRef.current !== undefined) cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', handleResize)
      timersRef.current.forEach(clearTimeout)
    }
  }, [isDark])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none', zIndex: 0 }}
    />
  )
}