const store = new Map<string, { expires: number; body: string }>()
const DEFAULT_TTL_MS = 90_000

export function cacheGet(key: string): string | null {
  const e = store.get(key)
  if (!e) return null
  if (Date.now() > e.expires) {
    store.delete(key)
    return null
  }
  return e.body
}

export function cacheSet(key: string, body: string, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { expires: Date.now() + ttlMs, body })
}

export async function fetchJsonCached(
  key: string,
  url: string,
  init: RequestInit | undefined,
  minIntervalMs: number,
): Promise<unknown> {
  const hit = cacheGet(key)
  if (hit) return JSON.parse(hit) as unknown

  if (minIntervalMs > 0) {
    await new Promise((r) => setTimeout(r, minIntervalMs))
  }
  const res = await fetch(url, init)
  if (res.status === 429) {
    throw new Error('Слишком много запросов (429). Подождите и уменьшите лимит строк.')
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} для ${url}`)
  }
  const text = await res.text()
  cacheSet(key, text)
  return JSON.parse(text) as unknown
}
