import { $createListItemNode, $isListItemNode, $isListNode, ListNode, type ListType } from '@lexical/list'
import type { LexicalNode } from 'lexical'
import { $createTextNode, $isElementNode, type EditorConfig, type NodeKey } from 'lexical'
import type { CustomListMarker, CustomListStyleType, SerializedCustomListNode } from './CustomListTypes'
import { addClassNamesToElement, removeClassNamesFromElement } from '@lexical/utils'
import { $createCustomListNode } from './$createCustomListNode'
import { listStyleTypeToDOMType } from './listStyleTypeToDOMType'

export class CustomListNode extends ListNode {
  __listMarker?: CustomListMarker
  __listStyleType?: CustomListStyleType

  constructor(
    listType: ListType,
    start: number,
    listStyleType?: CustomListStyleType,
    listMarker?: CustomListMarker,
    key?: NodeKey,
  ) {
    super(listType, start, key)
    if (listType !== 'number') {
      return
    }

    this.__listStyleType = listStyleType
    this.__listMarker = listMarker
  }

  getListStyleType() {
    return this.__listStyleType
  }

  getListMarker() {
    return this.__listMarker
  }

  setListStyleType(listStyleType: CustomListStyleType) {
    const writable = this.getWritable()
    writable.__listStyleType = listStyleType
  }
  setMarker(marker: CustomListMarker) {
    this.getWritable().__listMarker = marker
  }

  static getType() {
    return 'custom-list'
  }

  static clone(node: CustomListNode) {
    return new CustomListNode(node.__listType, node.__start, node.__listStyleType, node.__listMarker, node.__key)
  }

  static importJSON(serializedNode: SerializedCustomListNode): ListNode {
    const node = $createCustomListNode(
      serializedNode.listType,
      serializedNode.start,
      serializedNode.listStyleType,
      serializedNode.listMarker,
    )
    node.setFormat(serializedNode.format)
    node.setIndent(serializedNode.indent)
    node.setDirection(serializedNode.direction)
    return node
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config)
    if (!(dom instanceof HTMLOListElement)) {
      return dom
    }
    if (this.__listMarker === 'bracket') {
      addClassNamesToElement(dom, 'Lexical__ol--bracket-marker')
    } else {
      removeClassNamesFromElement(dom, 'Lexical__ol--bracket-marker')
    }

    if (this.__listStyleType) {
      // Adding type so that HTML Serialization contains information of the list type
      dom.setAttribute('type', listStyleTypeToDOMType(this.__listStyleType))
      addClassNamesToElement(dom, `Lexical__ol--${this.__listStyleType}`)
    } else {
      dom.removeAttribute('type')
      removeClassNamesFromElement(
        dom,
        `Lexical__ol--lower-alpha`,
        `Lexical__ol--upper-alpha`,
        `Lexical__ol--lower-roman`,
        `Lexical__ol--upper-roman`,
      )
    }

    return dom
  }
  exportJSON() {
    return {
      ...super.exportJSON(),
      listStyleType: this.getListStyleType(),
      listMarker: this.getListMarker(),
      type: 'custom-list',
      version: 1,
    }
  }

  // The original ListNode implementation seems to only append
  // text content for element nodes even if they're inline
  append(...nodesToAppend: LexicalNode[]): this {
    for (let index = 0; index < nodesToAppend.length; index++) {
      const currentNode = nodesToAppend[index]

      if ($isListItemNode(currentNode)) {
        super.append(currentNode)
      } else {
        const listItemNode = $createListItemNode()

        if ($isListNode(currentNode)) {
          listItemNode.append(currentNode)
        } else if ($isElementNode(currentNode)) {
          if (currentNode.isInline()) {
            listItemNode.append(currentNode)
          } else {
            const textNode = $createTextNode(currentNode.getTextContent())
            listItemNode.append(textNode)
          }
        } else {
          listItemNode.append(currentNode)
        }

        super.append(listItemNode)
      }
    }
    return this
  }
}
