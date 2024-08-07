import { $isCodeNode } from '@lexical/code'
import { $isLinkNode } from '@lexical/link'
import { $isListItemNode, $isListNode } from '@lexical/list'
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text'
import { $isTableNode, $isTableCellNode, $isTableRowNode } from '@lexical/table'
import { type LexicalNode, $isLineBreakNode, $isTextNode, $isElementNode, $isParagraphNode } from 'lexical'
import { $isImageNode } from '../../../../Plugins/Image/ImageNode'
import { ExportStyles } from '../ExportStyles'
import { getFontSizeForHeading } from './getFontSizeForHeading'
import { getListItemNode } from './getListItemNode'
import { getNodeTextAlignment } from './getNodeTextAlignment'
import type { PDFDataNode } from '../PDFDataNode'
import { $isHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'

export const getPDFDataNodeFromLexicalNode = (node: LexicalNode): PDFDataNode => {
  const parent = node.getParent()

  if ($isLineBreakNode(node)) {
    return {
      type: 'Text',
      children: '\n',
    }
  }

  if ($isTextNode(node)) {
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
  }

  if ($isCodeNode(node)) {
    const children = node.getChildren()
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
      children: lines.map((line) => {
        return {
          type: 'View',
          style: [ExportStyles.row, ExportStyles.wrap],
          children: line.map((child) => {
            return getPDFDataNodeFromLexicalNode(child)
          }),
        }
      }),
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
    return {
      type: 'Image',
      src: node.__src,
    }
  }

  const children =
    $isElementNode(node) || $isTableNode(node) || $isTableCellNode(node) || $isTableRowNode(node)
      ? node.getChildren().map((child) => {
          return getPDFDataNodeFromLexicalNode(child)
        })
      : undefined

  if ($isLinkNode(node)) {
    return {
      type: 'Link',
      src: node.getURL(),
      children,
    }
  }

  if ($isListItemNode(node)) {
    if (!$isListNode(parent)) {
      return null
    }

    const listType = parent.getListType()

    const isNestedList = node.getChildren().some((child) => $isListNode(child))

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
      value: node.getValue(),
      checked: node.getChecked(),
    })
  }

  if ($isListNode(node)) {
    return {
      type: 'View',
      style: [
        ExportStyles.column,
        {
          gap: 7,
        },
      ],
      children,
    }
  }

  if ($isParagraphNode(node) && node.getTextContent().length === 0) {
    return null
  }

  if ($isTableCellNode(node)) {
    return {
      type: 'View',
      style: {
        backgroundColor: node.hasHeader() ? '#f4f5f7' : undefined,
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
          fontSize: $isHeadingNode(node) ? getFontSizeForHeading(node) : undefined,
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
    children: [{ type: 'Text', children: node.getTextContent() }],
  }
}
