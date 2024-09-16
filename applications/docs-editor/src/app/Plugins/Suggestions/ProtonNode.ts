import type {
  BaseSelection,
  EditorConfig,
  LexicalNode,
  NodeKey,
  RangeSelection,
  SerializedElementNode,
  Spread,
} from 'lexical'
import { $isRangeSelection, $isRootOrShadowRoot, ElementNode } from 'lexical'
import type { SuggestionProperties } from './Types'
import { ProtonNodeTypes, type SuggestionType } from './Types'
import { addClassNamesToElement } from '@lexical/utils'

type ProtonNodeProperties = SuggestionProperties

type SerializedProtonNode = Spread<
  {
    properties: ProtonNodeProperties
  },
  SerializedElementNode
>

/**
 * Generic node which can contain a bag of properties.
 * Currently used for suggestion nodes.
 *
 * _This node should not be removed from the codebase
 * as it will lead to breakage of documents_
 */
export class ProtonNode extends ElementNode {
  __properties: ProtonNodeProperties

  static getType(): string {
    return 'proton-node'
  }

  constructor(props: ProtonNodeProperties, key?: NodeKey) {
    super(key)
    this.__properties = props
  }

  static clone(node: ProtonNode): ProtonNode {
    return new ProtonNode(node.__properties, node.__key)
  }

  static importJSON(serializedNode: SerializedProtonNode): ProtonNode {
    const node = $createProtonNode(serializedNode.properties)
    node.setFormat(serializedNode.format)
    node.setIndent(serializedNode.indent)
    node.setDirection(serializedNode.direction)
    return node
  }

  exportJSON(): SerializedProtonNode {
    return {
      ...super.exportJSON(),
      type: 'proton-node',
      properties: this.__properties,
      version: 1,
    }
  }

  createDOM(): HTMLElement {
    const element = document.createElement('mark')
    const properties = this.__properties
    if (properties.nodeType === 'suggestion') {
      addClassNamesToElement(element, 'Lexical__Suggestion')
      addClassNamesToElement(element, properties.suggestionType)
      element.setAttribute('data-suggestion-id', properties.suggestionID)
    }
    return element
  }

  updateDOM(prevNode: ProtonNode, element: HTMLElement, config: EditorConfig): boolean {
    return false
  }

  insertNewAfter(_selection: RangeSelection, restoreSelection = true): null | ElementNode {
    const node = $createProtonNode(this.__properties)
    this.insertAfter(node, restoreSelection)
    return node
  }

  /**
   * When this method returns `false`, and the user types text before this node,
   * Lexical will not try to insert that text inside this node.
   * This is important so that Lexical doesn't insert text into suggestion nodes which
   * are supposed to be empty, for e.g. split or join suggestions.
   */
  canInsertTextBefore(): false {
    return false
  }

  /**
   * When this method returns `false`, and the user types text after this node,
   * Lexical will not try to insert that text inside this node.
   * This is important so that Lexical doesn't insert text into suggestion nodes which
   * are supposed to be empty, for e.g. split or join suggestions.
   */
  canInsertTextAfter(): false {
    return false
  }

  canBeEmpty(): true {
    return true
  }

  isInline(): true {
    return true
  }

  isShadowRoot(): boolean {
    return $isRootOrShadowRoot(this.getParent())
  }

  extractWithChild(child: LexicalNode, selection: BaseSelection, destination: 'clone' | 'html'): boolean {
    if (!$isRangeSelection(selection) || destination === 'html') {
      return false
    }
    const anchor = selection.anchor
    const focus = selection.focus
    const anchorNode = anchor.getNode()
    const focusNode = focus.getNode()
    const isBackward = selection.isBackward()
    const selectionLength = isBackward ? anchor.offset - focus.offset : focus.offset - anchor.offset
    return this.isParentOf(anchorNode) && this.isParentOf(focusNode) && this.getTextContent().length === selectionLength
  }

  /**
   * Returning true from this will exclude this node from serialization
   * The children of the node will not be excluded unless they also specifically
   * override this method and return false.
   * Here we return true if the destination is not 'clone', which makes sure it
   * will still be serialized when we do `editorState.toJSON()` but not when
   * we call `$generateHtml..` or `$generateJSON..` as they check this method
   * with a destination of 'html'
   */
  excludeFromCopy(destination: 'clone' | 'html'): boolean {
    return destination !== 'clone'
  }

  getProtonNodeType(): ProtonNodeTypes {
    return this.__properties.nodeType
  }

  getSuggestionIdOrThrow(): string {
    const props = this.__properties
    if (props.nodeType !== 'suggestion') {
      throw new Error('Node is not suggestion node')
    }
    return props.suggestionID
  }

  setSuggestionId(id: string) {
    const writable = this.getWritable()
    if (writable.__properties.nodeType !== 'suggestion') {
      throw new Error('Node is not suggestion node')
    }
    writable.__properties.suggestionID = id
  }

  getSuggestionTypeOrThrow(): SuggestionType {
    const props = this.__properties
    if (props.nodeType !== 'suggestion') {
      throw new Error('Node is not suggestion node')
    }
    return props.suggestionType
  }
}

export function $createProtonNode(props: ProtonNodeProperties) {
  return new ProtonNode(props)
}

export function $createSuggestionNode(
  id: string,
  type: SuggestionType,
  changedProperties?: SuggestionProperties['nodePropertiesChanged'],
): ProtonNode {
  return $createProtonNode({
    nodeType: ProtonNodeTypes.Suggestion,
    suggestionID: id,
    suggestionType: type,
    nodePropertiesChanged: changedProperties,
  })
}

export function $isSuggestionNode(node: LexicalNode | null | undefined): node is ProtonNode {
  return node instanceof ProtonNode && node.getProtonNodeType() === ProtonNodeTypes.Suggestion
}
