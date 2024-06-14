import { $createLinkNode } from '@lexical/link'
import { $createListItemNode, $createListNode, ListType } from '@lexical/list'
import { $createHeadingNode, HeadingTagType } from '@lexical/rich-text'
import { $createTableCellNode, $createTableNode, $createTableRowNode, TableCellHeaderStates } from '@lexical/table'
import { praseAsync } from 'docx-preview-cjs'
import {
  $createParagraphNode,
  $createTextNode,
  $insertNodes,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  TextFormatType,
} from 'lexical'

import { $createImageNode } from '../Plugins/Image/ImageNode'
import { sendErrorMessage } from '../Utils/errorMessage'

type ParsedNode = (
  | {
      type: 'paragraph'
      format?: ElementFormatType
      indentLevel?: number
    }
  | {
      type: 'heading'
      tagType: HeadingTagType
      format?: ElementFormatType
      indentLevel?: number
    }
  | {
      type: 'image'
      src: string
    }
  | {
      type: 'link'
      href: string
    }
  | {
      type: 'text'
      text: string
      cssText?: string
      formats?: TextFormatType[]
    }
  | {
      type: 'table'
    }
  | {
      type: 'table-row'
    }
  | {
      type: 'table-cell'
      backgroundColor?: string
      width?: number
    }
  | {
      type: 'list-item'
      listType: ListType
      checked: boolean | undefined
    }
) & {
  children?: ParsedNode[]
}

async function parseChild(
  child: {
    type: string
    children: any[]
    id?: string
    cssStyle?: any
    verticalAlign?: string
    styleName?: string
    numbering?: {
      id: string
      level: number
    }
  },
  parsedDocx: any,
): Promise<ParsedNode | null> {
  const rels = parsedDocx.documentPart.rels
  // const files = parsedDocx._package._zip.files;

  const getChildren = async (children: any[]) => {
    if (!children || !children.length) {
      return []
    }
    return (await Promise.all(children.map((child: any) => parseChild(child, parsedDocx)))).filter(
      Boolean,
    ) as ParsedNode[]
  }

  if (child.type === 'cell' && child.children.length) {
    const children = await getChildren(child.children)

    const cell: ParsedNode = {
      type: 'table-cell',
      children,
    }

    if (child.cssStyle) {
      if (child.cssStyle['background-color']) {
        cell.backgroundColor = child.cssStyle['background-color']
      }
      if (child.cssStyle.width) {
        // probably should check for NaN too
        const width = parseFloat(child.cssStyle.width)
        const isPt = child.cssStyle.width.endsWith('pt')
        // 1pt = 1.3333333333333333px
        const widthInPx = isPt ? width * 1.3333333333333333 : width
        cell.width = widthInPx
      }
    }

    return cell
  }

  if (child.type === 'row' && child.children.length) {
    const nodes = await getChildren(child.children)

    return {
      type: 'table-row',
      children: nodes,
    }
  }

  if (child.type === 'table' && child.children.length) {
    const nodes = await getChildren(child.children)

    return {
      type: 'table',
      children: nodes,
    }
  }

  if (
    child.type === 'drawing' &&
    child.children &&
    child.children.length === 1 &&
    child.children.every((child: any) => child.type === 'image')
  ) {
    const image = child.children[0]

    const src = await parsedDocx.loadDocumentImage(image.src)

    return {
      type: 'image',
      src,
    }
  }

  if (child.type === 'run' && child.children) {
    if (child.children.length === 1 && child.children.every((child: any) => child.type === 'text')) {
      const node: ParsedNode = {
        type: 'text',
        text: child.children[0].text,
      }
      const formats: TextFormatType[] = []
      let cssText = ''
      if (child.cssStyle) {
        if (child.cssStyle['font-weight'] === 'bold') {
          formats.push('bold')
        }
        if (child.cssStyle['font-style'] === 'italic') {
          formats.push('italic')
        }
        if (child.cssStyle['text-decoration'] === 'underline') {
          formats.push('underline')
        }
        if (child.cssStyle['font-size']) {
          cssText += `font-size: ${child.cssStyle['font-size']};`
        }
        if (child.cssStyle.color) {
          cssText += `color: ${child.cssStyle.color};`
        }
        if (child.cssStyle['background-color']) {
          cssText += `background-color: ${child.cssStyle['background-color']};`
        }
      }
      if (child.verticalAlign === 'sub') {
        formats.push('subscript')
      } else if (child.verticalAlign === 'sup') {
        formats.push('superscript')
      }
      node.formats = formats
      node.cssText = cssText
      return node
    }

    if (child.children.length === 1 && child.children.every((child: any) => child.type === 'drawing')) {
      const parsed = await parseChild(child.children[0], parsedDocx)
      return parsed
    }

    return null
  }

  if (child.type === 'hyperlink') {
    if (!rels) {
      return null
    }

    const rel = rels.find((rel: any) => rel.id === child.id)
    if (!rel || !rel.target) {
      return null
    }

    const nodes = await getChildren(child.children)

    return {
      type: 'link',
      href: rel.target,
      children: nodes,
    }
  }

  if (child.type === 'paragraph') {
    let childNodes: ParsedNode[] | undefined
    if (child.children && child.children.length > 0) {
      childNodes = await getChildren(child.children)
    }

    let elementFormat: ElementFormatType | undefined
    if (child.cssStyle && child.cssStyle['text-align']) {
      elementFormat = child.cssStyle['text-align']
    }

    let indentLevel: number | undefined
    if (child.cssStyle && child.cssStyle['margin-left'] && child.cssStyle['text-indent']) {
      const marginLeft = parseInt(child.cssStyle['margin-left'])
      const parsedLevel = marginLeft / 36
      if (parsedLevel) {
        indentLevel = Math.floor(parsedLevel)
      }
    }

    if (child.styleName && child.styleName.startsWith('Heading')) {
      const level = parseInt(child.styleName.replace('Heading', ''), 10)
      const clampedLevel = Math.max(1, Math.min(6, level))

      const node: ParsedNode = {
        type: 'heading',
        tagType: `h${clampedLevel}` as HeadingTagType,
        format: elementFormat,
        children: childNodes,
        indentLevel,
      }

      return node
    }

    if (child.numbering) {
      const { id } = child.numbering
      let listType: ListType = 'bullet'

      if (id === '2') {
        listType = 'number'
      } else if (id === '3') {
        listType = 'check'
      }

      let checked: boolean | undefined

      if (
        listType === 'check' &&
        child.children.some((child) => child.cssStyle && child.cssStyle['text-decoration'] === 'line-through')
      ) {
        checked = true
      }

      return {
        type: 'list-item',
        listType,
        children: childNodes,
        checked,
      }
    }

    return {
      type: 'paragraph',
      format: elementFormat,
      children: childNodes,
      indentLevel,
    }
  }

  return null
}

function createLexicalNode(node: ParsedNode): LexicalNode {
  if (node.type === 'table-cell') {
    const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS)
    if (node.children) {
      const children = node.children.map(createLexicalNode)
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
      const children = node.children.map(createLexicalNode)
      row.append(...children)
    }
    return row
  }
  if (node.type === 'table') {
    const table = $createTableNode()
    if (node.children) {
      const children = node.children.map(createLexicalNode)
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
      const children = node.children.map(createLexicalNode)
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
      const children = node.children.map(createLexicalNode)
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
      const children = node.children.map(createLexicalNode)
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
      const children = node.children.map(createLexicalNode)
      listItem.append(...children)
    }
    list.append(listItem)
    return list
  }
  throw new Error(`Unknown node type`)
}

export async function $importNodesFromDocx(editor: LexicalEditor, docx: Blob | ArrayBuffer | Uint8Array) {
  const parsedDocx: {
    documentPart: {
      body: {
        children: any[]
      }
    }
  } = await praseAsync(docx, {
    useBase64URL: true,
  })

  await new Promise((resolve) => {
    Promise.all(parsedDocx.documentPart.body.children.map((child) => parseChild(child, parsedDocx)))
      .then((nodes) => {
        const filteredNodes = nodes.filter((node) => node !== null) as ParsedNode[]
        editor.update(
          () => {
            const nodes: LexicalNode[] = filteredNodes.map(createLexicalNode)
            $insertNodes(nodes.concat($createParagraphNode()))
          },
          {
            discrete: true,
          },
        )
      })
      .then(resolve)
      .catch(sendErrorMessage)
  })
}
