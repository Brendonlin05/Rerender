/** Keep in sync with `ParametersPanel` character options. */
export const CHAR_STYLES_ORDER = ['Full', 'Numbers', 'Blocks', 'Minimal'] as const

export type ShareableSettings = {
  colorIdx: number
  pixelSize: number
  charStyle: string
  pixelBg: boolean
}

export const DEFAULT_SHARE_SETTINGS: ShareableSettings = {
  colorIdx: 0,
  pixelSize: 20,
  charStyle: 'Full',
  pixelBg: true,
}

const SHARE_KEYS = ['c', 'ps', 'cs', 'pb'] as const

function charStyleIndex(name: string): number {
  const i = (CHAR_STYLES_ORDER as readonly string[]).indexOf(name)
  return i >= 0 ? i : 0
}

/** Read `?c=&ps=&cs=&pb=` from a query string. Missing keys are omitted (merge with defaults). */
export function parseShareSearch(raw: string): Partial<ShareableSettings> {
  const q = raw.startsWith('?') ? raw.slice(1) : raw
  const p = new URLSearchParams(q)
  const out: Partial<ShareableSettings> = {}

  if (p.has('c')) {
    const v = Number(p.get('c'))
    if (!Number.isNaN(v)) out.colorIdx = Math.max(0, Math.min(5, Math.floor(v)))
  }
  if (p.has('ps')) {
    const v = Number(p.get('ps'))
    if (!Number.isNaN(v)) out.pixelSize = Math.max(10, Math.min(40, Math.floor(v)))
  }
  if (p.has('cs')) {
    const v = Number(p.get('cs'))
    if (!Number.isNaN(v)) {
      const i = Math.max(0, Math.min(CHAR_STYLES_ORDER.length - 1, Math.floor(v)))
      out.charStyle = CHAR_STYLES_ORDER[i]
    }
  }
  if (p.has('pb')) {
    out.pixelBg = p.get('pb') === '1' || p.get('pb') === 'true'
  }

  return out
}

export function hasShareParamsInSearch(search: string): boolean {
  const q = search.startsWith('?') ? search.slice(1) : search
  const p = new URLSearchParams(q)
  return SHARE_KEYS.some(k => p.has(k))
}

export function mergeShareSettings(partial: Partial<ShareableSettings>): ShareableSettings {
  return { ...DEFAULT_SHARE_SETTINGS, ...partial }
}

export function buildShareQuery(s: ShareableSettings): string {
  const p = new URLSearchParams({
    c: String(s.colorIdx),
    ps: String(s.pixelSize),
    cs: String(charStyleIndex(s.charStyle)),
    pb: s.pixelBg ? '1' : '0',
  })
  return p.toString()
}
