import type { EditorState, ElementNode, TextNode } from 'lexical'
import { TextRun } from 'docx'
import tinycolor from 'tinycolor2'
import { rootFontSize } from '@proton/shared/lib/helpers/dom'
import { $isLinkNode } from '@lexical/link'

import { DEFAULT_FONT_FACE } from '@proton/components/components/editor/constants'

const DummyElementUsedToConvertTextNodeCSSTextToComputedStyles = document.createElement('span')

function pixelsToPoints(pixels: number) {
  return pixels * 0.75
}

export function getTextRun(node: TextNode, parentNode: ElementNode, state: EditorState): TextRun {
  return state.read(() => {
    const style = node.getStyle()
    DummyElementUsedToConvertTextNodeCSSTextToComputedStyles.style.cssText = style

    const color = DummyElementUsedToConvertTextNodeCSSTextToComputedStyles.style.color
    const backgroundColor = DummyElementUsedToConvertTextNodeCSSTextToComputedStyles.style.backgroundColor

    const fontFamilyFromStyle = DummyElementUsedToConvertTextNodeCSSTextToComputedStyles.style.fontFamily
    const fontFamily = fontFamilyFromStyle ? fontFamilyFromStyle : DEFAULT_FONT_FACE

    const fontSizeFromStyle = DummyElementUsedToConvertTextNodeCSSTextToComputedStyles.style.fontSize
    const fontSizeInPx = fontSizeFromStyle ? parseFloat(fontSizeFromStyle) : rootFontSize()
    const fontSizeInPt = pixelsToPoints(fontSizeInPx)

    const text = node.getTextContent()
    const bold = node.hasFormat('bold')
    const italics = node.hasFormat('italic')
    const underline = node.hasFormat('underline')
    const strike = node.hasFormat('strikethrough')
    const subScript = node.hasFormat('subscript')
    const superScript = node.hasFormat('superscript')

    return new TextRun({
      text,
      bold,
      italics,
      underline: {
        type: underline ? 'single' : 'none',
      },
      strike,
      subScript,
      superScript,
      color: color ? tinycolor(color).toHex() : undefined,
      shading: backgroundColor ? { type: 'clear', fill: tinycolor(backgroundColor).toHex() } : undefined,
      size: `${fontSizeInPt}pt`,
      style: $isLinkNode(parentNode) ? 'Hyperlink' : undefined,
      font: fontFamily,
    })
  })
}
