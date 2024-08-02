import { $createLinkNode } from '@lexical/link'
import { $createListNode, $createListItemNode } from '@lexical/list'
import { $createHeadingNode } from '@lexical/rich-text'
import { $createTableCellNode, TableCellHeaderStates, $createTableRowNode, $createTableNode } from '@lexical/table'
import { type LexicalNode, $createParagraphNode, $createTextNode } from 'lexical'
import { $createImageNode } from '../../../Plugins/Image/ImageNode'
import type { DocxToLexicalInfo } from './Parsing/DocxToLexicalInfo'

export function CreateLexicalNodeFromDocxInfo(node: DocxToLexicalInfo): LexicalNode {
  if (node.type === 'table-cell') {
    const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS)
    if (node.children) {
      const children = node.children.map(CreateLexicalNodeFromDocxInfo)
      cell.append(...children)
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
      const children = node.children.map(CreateLexicalNodeFromDocxInfo)
      row.append(...children)
    }
    return row
  }

  if (node.type === 'table') {
    const table = $createTableNode()
    if (node.children) {
      const children = node.children.map(CreateLexicalNodeFromDocxInfo)
      table.append(...children)
    }
    return table
  }

  if (node.type === 'paragraph') {
    const paragraph = $createParagraphNode()
    if (node.format) {
      paragraph.setFormat(node.format)
    }
    if (node.children) {
      const children = node.children.map(CreateLexicalNodeFromDocxInfo)
      paragraph.append(...children)
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
      const children = node.children.map(CreateLexicalNodeFromDocxInfo)
      heading.append(...children)
    }
    if (node.indentLevel) {
      heading.setIndent(node.indentLevel)
    }
    return heading
  }

  if (node.type === 'image') {
    return $createImageNode({
      src: node.src,
      altText: '',
    })
  }

  if (node.type === 'link') {
    const link = $createLinkNode(node.href)
    if (node.children) {
      const children = node.children.map(CreateLexicalNodeFromDocxInfo)
      link.append(...children)
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
      const children = node.children.map(CreateLexicalNodeFromDocxInfo)
      listItem.append(...children)
    }
    list.append(listItem)
    return list
  }

  throw new Error(`Unknown node type`)
}
