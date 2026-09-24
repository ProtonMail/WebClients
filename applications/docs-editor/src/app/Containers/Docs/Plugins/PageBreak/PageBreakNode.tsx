import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { addClassNamesToElement, mergeRegister, removeClassNamesFromElement } from '@lexical/utils'
import { c } from 'ttag'
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalCommand,
  LexicalNode,
  SerializedLexicalNode,
} from 'lexical'
import { $applyNodeReplacement, CLICK_COMMAND, COMMAND_PRIORITY_LOW, DecoratorNode, createCommand } from 'lexical'
import type { JSX } from 'react'
import { useEffect } from 'react'

export type SerializedPageBreakNode = SerializedLexicalNode

export const INSERT_PAGE_BREAK_COMMAND: LexicalCommand<void> = createCommand('INSERT_PAGE_BREAK_COMMAND')

function PageBreakComponent({ nodeKey }: { nodeKey: string }) {
  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event) => {
          const element = editor.getElementByKey(nodeKey)
          if (event.target !== element) {
            return false
          }

          if (!event.shiftKey) {
            clearSelection()
          }
          setSelected(!isSelected)
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [clearSelection, editor, isSelected, nodeKey, setSelected])

  useEffect(() => {
    const element = editor.getElementByKey(nodeKey)
    if (!element) {
      return
    }

    if (isSelected) {
      addClassNamesToElement(element, 'selected')
    } else {
      removeClassNamesFromElement(element, 'selected')
    }
  }, [editor, isSelected, nodeKey])

  return null
}

function $convertPageBreakElement(): DOMConversionOutput {
  return {
    node: $createPageBreakNode(),
  }
}

export class PageBreakNode extends DecoratorNode<JSX.Element> {
  static getType(): string {
    return 'pagebreak'
  }

  static clone(node: PageBreakNode): PageBreakNode {
    return new PageBreakNode(node.__key)
  }

  static importJSON(serializedNode: SerializedPageBreakNode): PageBreakNode {
    return $createPageBreakNode().updateFromJSON(serializedNode)
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (node) => {
        if (!(node instanceof HTMLDivElement) || node.dataset.lexicalPageBreak !== 'true') {
          return null
        }

        return {
          conversion: $convertPageBreakElement,
          priority: 1,
        }
      },
      pagebreak: () => ({
        conversion: $convertPageBreakElement,
        priority: 1,
      }),
    }
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div')
    element.dataset.lexicalPageBreak = 'true'
    element.style.breakAfter = 'page'
    element.style.pageBreakAfter = 'always'
    return { element }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('div')
    addClassNamesToElement(element, 'Lexical__pageBreak', config.theme.hr)
    element.dataset.lexicalPageBreak = 'true'
    element.dataset.label = c('Label').t`Page break`
    element.setAttribute('aria-label', c('Label').t`Page break`)
    element.contentEditable = 'false'
    return element
  }

  getTextContent(): string {
    return '\n'
  }

  isInline(): false {
    return false
  }

  updateDOM(): boolean {
    return false
  }

  decorate(): JSX.Element {
    return <PageBreakComponent nodeKey={this.__key} />
  }
}

export function $createPageBreakNode(): PageBreakNode {
  return $applyNodeReplacement(new PageBreakNode())
}

export function $isPageBreakNode(node: LexicalNode | null | undefined): node is PageBreakNode {
  return node instanceof PageBreakNode
}
