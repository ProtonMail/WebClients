export const LoadedFontFamilies = new Set<string>()

export async function loadFont(font: string) {
  const [fontFamily, _] = font.split(':')

  if (LoadedFontFamilies.has(fontFamily)) {
    return
  }

  const fontFamilyPath = fontFamily.replace(/ /g, '-')
  const url = `/assets/fonts/${fontFamilyPath}/${fontFamilyPath}.css`

  try {
    await loadFontCSS(url)
  } catch (error) {
    console.warn(`Error loading font CSS: ${url}.`)
  }

  await document.fonts.ready

  await document.fonts.load(`16px ${fontFamily}`)
  await document.fonts.load(`italic 16px ${fontFamily}`)
  await document.fonts.load(`bold 16px ${fontFamily}`)
  await document.fonts.load(`italic bold 16px ${fontFamily}`)

  LoadedFontFamilies.add(fontFamily)

  document.dispatchEvent(new CustomEvent('fontloaded'))
}

async function loadFontCSS(url: string) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.href = url
    link.rel = 'stylesheet'
    link.onload = () => resolve(undefined)
    link.onerror = (e) => {
      reject(new Error(`Failed to load CSS: ${url}`))
      console.warn(e)
    }
    document.head.appendChild(link)
  })
}
