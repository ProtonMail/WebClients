import { Font } from '@react-pdf/renderer'
import NotoSansJP from './Fonts/NotoSansJP-VariableFont_wght.ttf'
import NotoSansKR from './Fonts/NotoSansKR-VariableFont_wght.ttf'
import NotoSansSC from './Fonts/NotoSansSC-VariableFont_wght.ttf'
import { AvailableCustomFontNames } from './Fonts/Ranges'
import type { PDFDataNode } from './PDFDataNode'

const determineCustomFontsUsed = (nodes: PDFDataNode[]): Set<string> => {
  const customFontsUsed = new Set<string>()

  nodes.forEach((node) => {
    if (!node) {
      return
    }

    if (node.children && Array.isArray(node.children)) {
      const childResults = determineCustomFontsUsed(node.children)
      childResults.forEach((font) => {
        customFontsUsed.add(font)
      })
    }

    if (node.type !== 'Text') {
      return
    }

    const style = node.style
    if (!style) {
      return
    }

    if (Array.isArray(style)) {
      style.forEach((s) => {
        const fonts = Array.isArray(s.fontFamily) ? s.fontFamily : [s.fontFamily]
        fonts.forEach((font) => {
          if (font && AvailableCustomFontNames.includes(font)) {
            customFontsUsed.add(font)
          }
        })
      })
    } else {
      const fonts = Array.isArray(style.fontFamily) ? style.fontFamily : [style.fontFamily]
      fonts.forEach((font) => {
        if (font && AvailableCustomFontNames.includes(font)) {
          customFontsUsed.add(font)
        }
      })
    }
  })

  return customFontsUsed
}

export const LoadCustomFonts = (nodes: PDFDataNode[]) => {
  const fonts = determineCustomFontsUsed(nodes)

  for (const font of fonts) {
    if (font === 'Noto Sans JP') {
      Font.register({
        family: 'Noto Sans JP',
        src: NotoSansJP,
      })
    } else if (font === 'Noto Sans KR') {
      Font.register({
        family: 'Noto Sans KR',
        src: NotoSansKR,
      })
    } else if (font === 'Noto Sans SC') {
      Font.register({
        family: 'Noto Sans SC',
        src: NotoSansSC,
      })
    }
  }
}
