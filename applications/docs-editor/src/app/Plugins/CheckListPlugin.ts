import { $isListItemNode, $isListNode, INSERT_CHECK_LIST_COMMAND, insertList } from '@lexical/list'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { calculateZoomLevel, isHTMLElement, mergeRegister } from '@lexical/utils'
import { $getNearestNodeFromDOMNode, COMMAND_PRIORITY_LOW } from 'lexical'
import { useEffect } from 'react'

export function CheckListPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        INSERT_CHECK_LIST_COMMAND,
        () => {
          insertList(editor, 'check')
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerRootListener((rootElement, prevElement) => {
        function handleCheckItemEvent(event: PointerEvent, callback: () => void) {
          const target = event.target

          if (target === null || !isHTMLElement(target)) {
            return
          }

          // Ignore clicks on LI that have nested lists
          const firstChild = target.firstChild

          if (
            firstChild != null &&
            isHTMLElement(firstChild) &&
            (firstChild.tagName === 'UL' || firstChild.tagName === 'OL')
          ) {
            return
          }

          editor.read(() => {
            const targetNode = $getNearestNodeFromDOMNode(target)

            const parentNode = targetNode?.getParent()

            if (!$isListNode(parentNode) || parentNode.getListType() !== 'check') {
              return
            }

            const rect = target.getBoundingClientRect()

            const listItemElementStyles = getComputedStyle(target)
            const paddingLeft = parseFloat(listItemElementStyles.paddingLeft) || 0
            const paddingRight = parseFloat(listItemElementStyles.paddingRight) || 0
            const lineHeight = parseFloat(listItemElementStyles.lineHeight) || 0

            const pageX = event.pageX / calculateZoomLevel(target)

            const isWithinHorizontalThreshold =
              target.dir === 'rtl'
                ? pageX < rect.right && pageX > rect.right - paddingRight
                : pageX > rect.left && pageX < rect.left + paddingLeft

            const isWithinVerticalThreshold = event.clientY > rect.top && event.clientY < rect.top + lineHeight

            if (isWithinHorizontalThreshold && isWithinVerticalThreshold) {
              callback()
            }
          })
        }

        function handleClick(event: Event) {
          handleCheckItemEvent(event as PointerEvent, () => {
            if (!editor.isEditable()) {
              return
            }

            editor.update(() => {
              const domNode = event.target as HTMLElement

              if (!event.target) {
                return
              }

              const node = $getNearestNodeFromDOMNode(domNode)

              if (!$isListItemNode(node)) {
                return
              }

              domNode.focus()
              node.toggleChecked()
            })
          })
        }

        function handlePointerDown(event: PointerEvent) {
          handleCheckItemEvent(event, () => {
            // Prevents caret moving when clicking on check mark
            event.preventDefault()
          })
        }

        if (rootElement !== null) {
          rootElement.addEventListener('click', handleClick)
          rootElement.addEventListener('pointerdown', handlePointerDown)
        }

        if (prevElement !== null) {
          prevElement.removeEventListener('click', handleClick)
          prevElement.removeEventListener('pointerdown', handlePointerDown)
        }
      }),
    )
  }, [editor])

  return null
}
