import { $createLinkNode } from '@lexical/link'
import { $createListNode, $createListItemNode } from '@lexical/list'
import { $createHeadingNode } from '@lexical/rich-text'
import { $createTableCellNode, TableCellHeaderStates, $createTableRowNode, $createTableNode } from '@lexical/table'
import { type LexicalNode, $createParagraphNode, $createTextNode } from 'lexical'
import { $createImageNode } from '../../../Plugins/Image/ImageNode'
import { isAllowedImageSrc } from '../../../Conversion/ImageSrcUtils'
import type { DocxToLexicalInfo } from './Parsing/DocxToLexicalInfo'

export function mapDocxChildren(children: DocxToLexicalInfo[]): LexicalNode[] {
  return children.map(CreateLexicalNodeFromDocxInfo).filter((child): child is LexicalNode => child !== null)
}

export function CreateLexicalNodeFromDocxInfo(node: DocxToLexicalInfo): LexicalNode | null {
  if (node.type === 'table-cell') {
    const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS)
    if (node.children) {
      cell.append(...mapDocxChildren(node.children))
    }
    if (node.backgroundColor) {
      cell.setBackgroundColor(node.backgroundColor)
    }
    if (node.width) {
      cell.setWidth(node.width)
    }
    return cell
  }

  if (node.type === 'table-row') {
    const row = $createTableRowNode()
    if (node.children) {
      row.append(...mapDocxChildren(node.children))
    }
    return row
  }

  if (node.type === 'table') {
    const table = $createTableNode()
    if (node.children) {
      table.append(...mapDocxChildren(node.children))
    }
    return table
  }

  if (node.type === 'paragraph') {
    const paragraph = $createParagraphNode()
    if (node.format) {
      paragraph.setFormat(node.format)
    }
    if (node.children) {
      paragraph.append(...mapDocxChildren(node.children))
    }
    if (node.indentLevel) {
      paragraph.setIndent(node.indentLevel)
    }
    return paragraph
  }

  if (node.type === 'heading') {
    const heading = $createHeadingNode(node.tagType)
    if (node.format) {
      heading.setFormat(node.format)
    }
    if (node.children) {
      heading.append(...mapDocxChildren(node.children))
    }
    if (node.indentLevel) {
      heading.setIndent(node.indentLevel)
    }
    return heading
  }

  if (node.type === 'image') {
    if (!isAllowedImageSrc(node.src)) {
      return null
    }

    return $createImageNode({
      src: node.src,
      altText: '',
    })
  }

  if (node.type === 'link') {
    const link = $createLinkNode(node.href)
    if (node.children) {
      link.append(...mapDocxChildren(node.children))
    }
    return link
  }

  if (node.type === 'text') {
    const text = $createTextNode(node.text)
    if (node.cssText) {
      text.setStyle(node.cssText)
    }
    if (node.formats) {
      node.formats.forEach((format) => {
        text.toggleFormat(format)
      })
    }
    return text
  }

  if (node.type === 'list-item') {
    const list = $createListNode(node.listType)
    const listItem = $createListItemNode(node.checked)
    if (node.children) {
      listItem.append(...mapDocxChildren(node.children))
    }
    list.append(listItem)
    return list
  }

  throw new Error(`Unknown node type`)
}
