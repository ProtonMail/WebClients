import { $isCodeNode } from '@lexical/code'
import { $isLinkNode } from '@lexical/link'
import { $isListItemNode, $isListNode } from '@lexical/list'
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text'
import { $isTableNode, $isTableCellNode, $isTableRowNode } from '@lexical/table'
import type { EditorState } from 'lexical'
import { type LexicalNode, $isLineBreakNode, $isTextNode, $isElementNode, $isParagraphNode } from 'lexical'
import { $isImageNode } from '../../../../Plugins/Image/ImageNode'
import { ExportStyles } from '../ExportStyles'
import { getFontSizeForHeading } from './getFontSizeForHeading'
import { getListItemNode } from './getListItemNode'
import { getNodeTextAlignment } from './getNodeTextAlignment'
import type { PDFDataNode } from '../PDFDataNode'
import { $isHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { toImage } from '@proton/shared/lib/helpers/image'
import { isWebpImage } from '../../../ImageSrcUtils'

const MaxEditorWidth = 816
const ApproximateWidthOfA4PDF = 595
const ApproximatePaddingThatGivesGoodResults = 19
const MaxImageWidth = ApproximateWidthOfA4PDF + ApproximatePaddingThatGivesGoodResults
const EditorToPDFConversionFactor = MaxImageWidth / MaxEditorWidth

function pixelsToPoints(pixels: number): number {
  return pixels * 0.75
}

export const getPDFDataNodeFromLexicalNode = async (node: LexicalNode, state: EditorState): Promise<PDFDataNode> => {
  if ($isLineBreakNode(node)) {
    return {
      type: 'Text',
      children: '\n',
    }
  }

  const parent = state.read(() => node.getParent())
  if ($isTextNode(node)) {
    return state.read(() => {
      const isInlineCode = node.hasFormat('code')
      const isCodeNodeText = $isCodeNode(parent)
      const isBold = node.hasFormat('bold')
      const isItalic = node.hasFormat('italic')
      const isHighlight = node.hasFormat('highlight')

      let font = isInlineCode || isCodeNodeText ? 'Courier' : 'Helvetica'
      if (isBold || isItalic) {
        font += '-'
        if (isBold) {
          font += 'Bold'
        }
        if (isItalic) {
          font += 'Oblique'
        }
      }

      return {
        type: 'Text',
        children: node.getTextContent(),
        style: {
          fontFamily: font,
          // eslint-disable-next-line no-nested-ternary
          textDecoration: node.hasFormat('underline')
            ? 'underline'
            : node.hasFormat('strikethrough')
              ? 'line-through'
              : undefined,
          // eslint-disable-next-line no-nested-ternary
          backgroundColor: isInlineCode ? '#f1f1f1' : isHighlight ? 'rgb(255,255,0)' : undefined,
          fontSize: isInlineCode || isCodeNodeText ? 11 : undefined,
          textAlign: $isElementNode(parent) ? getNodeTextAlignment(parent) : 'left',
        },
      }
    })
  }

  if ($isCodeNode(node)) {
    const children = state.read(() => node.getChildren())
    const lines: LexicalNode[][] = [[]]

    for (let i = 0, currentLine = 0; i < children.length; i++) {
      const child = children[i]

      if (!$isLineBreakNode(child)) {
        lines[currentLine].push(child)
      } else {
        lines.push([])
        currentLine++
      }
    }

    const processedLines: PDFDataNode[] = []
    for (const line of lines) {
      const sublines: PDFDataNode[] = []
      for (const subline of line) {
        const processedSubline = await getPDFDataNodeFromLexicalNode(subline, state)
        sublines.push(processedSubline)
      }
      processedLines.push({
        type: 'View',
        style: [ExportStyles.row, ExportStyles.wrap],
        children: sublines,
      })
    }

    return {
      type: 'View',
      style: [
        ExportStyles.column,
        {
          backgroundColor: 'rgba(0,0,0,0.05)',
          padding: 12,
          borderRadius: 6,
          fontFamily: 'Courier',
        },
      ],
      children: processedLines,
    }
  }

  if ($isImageNode(node)) {
    if (!node.__src.startsWith('data:')) {
      return {
        type: 'View',
        style: ExportStyles.block,
        children: [
          {
            type: 'Link',
            src: node.__src,
            children: node.__src,
          },
        ],
      }
    }

    const src = node.__src
    if (isWebpImage(src)) {
      return null
    }

    let width = state.read(() => node.getWidth())
    let height = state.read(() => node.getHeight())

    if (width === 'inherit' || height === 'inherit') {
      const image = await toImage(src)
      width = width === 'inherit' ? image.width : width
      height = height === 'inherit' ? image.height : height
    }

    const aspectRatio = width && height ? width / height : 1

    let finalWidth = width
    let finalHeight = height

    if (width >= MaxImageWidth) {
      finalWidth = MaxImageWidth
      finalHeight = finalWidth / aspectRatio
    }

    finalWidth *= EditorToPDFConversionFactor
    finalHeight *= EditorToPDFConversionFactor

    const widthInPts = pixelsToPoints(finalWidth)
    const heightInPts = pixelsToPoints(finalHeight)

    return {
      type: 'Image',
      src: src,
      style: {
        width: widthInPts,
        height: heightInPts,
      },
    }
  }

  const children: PDFDataNode[] = []
  if ($isElementNode(node) || $isTableNode(node) || $isTableCellNode(node) || $isTableRowNode(node)) {
    for (const child of state.read(() => node.getChildren())) {
      const processedChild = await getPDFDataNodeFromLexicalNode(child, state)
      if (processedChild) {
        children.push(processedChild)
      }
    }
  }

  if ($isLinkNode(node)) {
    return {
      type: 'Link',
      src: state.read(() => node.getURL()),
      children,
    }
  }

  if ($isListItemNode(node)) {
    if (!$isListNode(parent)) {
      return null
    }

    const listType = state.read(() => parent.getListType())

    const isNestedList = state.read(() => node.getChildren()).some((child) => $isListNode(child))

    if (isNestedList) {
      return {
        type: 'View',
        style: [
          ExportStyles.column,
          {
            marginLeft: 10,
          },
        ],
        children,
      }
    }

    return getListItemNode({
      children,
      listType,
      value: state.read(() => node.getValue()),
      checked: state.read(() => node.getChecked()),
    })
  }

  if ($isListNode(node)) {
    return {
      type: 'View',
      style: [
        ExportStyles.column,
        {
          textAlign: state.read(() => getNodeTextAlignment(node)),
          gap: 7,
        },
      ],
      children,
    }
  }

  if ($isParagraphNode(node)) {
    if (state.read(() => node.getTextContent()).length === 0 && children) {
      return {
        type: 'View',
        children,
      }
    } else if (state.read(() => node.getTextContent()).length === 0) {
      return null
    }
  }

  if ($isTableCellNode(node)) {
    return {
      type: 'View',
      style: {
        backgroundColor: state.read(() => node.hasHeader()) ? '#f4f5f7' : undefined,
        borderColor: '#e3e3e3',
        borderWidth: 1,
        flex: 1,
        padding: 2,
      },
      children,
    }
  }

  if ($isTableRowNode(node)) {
    return {
      type: 'View',
      style: ExportStyles.row,
      children,
    }
  }

  if ($isTableNode(node)) {
    return {
      type: 'View',
      children,
    }
  }

  if ($isElementNode(node)) {
    return {
      type: 'View',
      style: [
        ExportStyles.block,
        ExportStyles.row,
        ExportStyles.wrap,
        {
          fontSize: $isHeadingNode(node) ? state.read(() => getFontSizeForHeading(node)) : undefined,
        },
        $isQuoteNode(node) ? ExportStyles.quote : {},
      ],
      children: [
        {
          type: 'Text',
          style: {
            lineHeight: $isHeadingNode(node) ? 1 : 1.5,
          },
          children,
        },
      ],
    }
  }

  if ($isHorizontalRuleNode(node)) {
    return {
      type: 'View',
      style: {
        width: '100%',
        borderBottom: '1px solid black',
      },
    }
  }

  return {
    type: 'View',
    style: [ExportStyles.page, ExportStyles.block, ExportStyles.row, ExportStyles.wrap],
    children: [{ type: 'Text', children: state.read(() => node.getTextContent()) }],
  }
}
