const loadedFontFamilies = new Set<string>()
const loadingFontFamilies = new Map<string, Promise<void>>()
let fontAssets: Promise<unknown> | undefined

function loadFontAssets(): Promise<unknown> {
  fontAssets ??= import('./font-assets.css').catch((error) => {
    fontAssets = undefined
    throw error
  })
  return fontAssets
}

export function getFontFamily(font: string): string {
  const [fontFamily] = font.split(':')
  return fontFamily
}

export function isFontLoaded(fontFamily: string): boolean {
  return loadedFontFamilies.has(fontFamily)
}

export async function loadFont(font: string): Promise<void> {
  const fontFamily = getFontFamily(font)

  if (loadedFontFamilies.has(fontFamily)) {
    return
  }

  const pendingLoad = loadingFontFamilies.get(fontFamily)
  if (pendingLoad) {
    return pendingLoad
  }

  const load = loadFontAssets()
    .then(() => document.fonts.ready)
    .then(async () => {
      await Promise.all([
        document.fonts.load(`16px ${fontFamily}`),
        document.fonts.load(`italic 16px ${fontFamily}`),
        document.fonts.load(`bold 16px ${fontFamily}`),
        document.fonts.load(`italic bold 16px ${fontFamily}`),
      ])

      loadedFontFamilies.add(fontFamily)
      document.dispatchEvent(new CustomEvent('fontloaded'))
    })
    .finally(() => {
      loadingFontFamilies.delete(fontFamily)
    })

  loadingFontFamilies.set(fontFamily, load)
  return load
}
