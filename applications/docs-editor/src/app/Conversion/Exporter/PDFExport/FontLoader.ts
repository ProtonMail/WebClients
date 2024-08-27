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
        if (s.fontFamily && AvailableCustomFontNames.includes(s.fontFamily)) {
          customFontsUsed.add(s.fontFamily)
        }
      })
    } else if (style.fontFamily && AvailableCustomFontNames.includes(style.fontFamily)) {
      customFontsUsed.add(style.fontFamily)
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
