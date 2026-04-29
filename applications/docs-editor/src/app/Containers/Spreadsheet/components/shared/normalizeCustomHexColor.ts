export function normalizeCustomHexColor(color: string) {
  const trimmedColor = color.trim()

  if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(trimmedColor)) {
    return `#${trimmedColor.replace(/^#/, '').toLowerCase()}`
  }

  return color
}
