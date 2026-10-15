const storageKey = 'proton-docs-recent-emojis'

export function readRecentEmojis(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string').slice(0, 12) : []
  } catch {
    return []
  }
}

export function rememberEmoji(id: string): string[] {
  const recent = [id, ...readRecentEmojis().filter((previous) => previous !== id)].slice(0, 12)
  try {
    localStorage.setItem(storageKey, JSON.stringify(recent))
  } catch {
    // Browser storage can be unavailable in private browsing or when full.
  }
  return recent
}
