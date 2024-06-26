import { $createListNode, $isListNode } from '@lexical/list'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { eventFiles } from '@lexical/rich-text'
import { mergeRegister } from '@lexical/utils'
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DRAGEND_COMMAND,
  DROP_COMMAND,
  LexicalEditor,
  LexicalNode,
  PASTE_COMMAND,
} from 'lexical'
import { DragEvent as ReactDragEvent, TouchEvent, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ContainsPointReturn, Rect } from '../../Utils/rect'
import { Point } from '../../Utils/point'
import { isHTMLElement } from '../../Utils/guard'
import { Icon } from '@proton/components'
import clsx from '@proton/utils/clsx'
import { c } from 'ttag'

import './index.scss'

const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu'
const DRAG_DATA_FORMAT = 'application/x-lexical-drag-block'
let draggedNodeKey = ''
const DRAGGABLE_ELEMENTS = ['TABLE']
const PASTE_LIMIT_BYTES = 1_000_000
const Downward = 1
const Upward = -1
const Indeterminate = 0

let prevIndex = Infinity

function getCurrentIndex(keysLength: number): number {
  if (keysLength === 0) {
    return Infinity
  }
  if (prevIndex >= 0 && prevIndex < keysLength) {
    return prevIndex
  }

  return Math.floor(keysLength / 2)
}

function getTopLevelNodeKeys(editor: LexicalEditor): string[] {
  return editor.getEditorState().read(() => $getRoot().getChildrenKeys())
}

function elementContainingEventLocation(
  anchorElem: HTMLElement,
  element: HTMLElement,
  eventLocation: Point,
): { contains: ContainsPointReturn; element: HTMLElement } {
  const anchorElementRect = anchorElem.getBoundingClientRect()

  const elementDomRect = Rect.fromDOM(element)
  const { marginTop, marginBottom } = window.getComputedStyle(element)

  const rect = elementDomRect.generateNewRect({
    bottom: elementDomRect.bottom + parseFloat(marginBottom),
    left: anchorElementRect.left,
    right: anchorElementRect.right,
    top: elementDomRect.top - parseFloat(marginTop),
  })

  const children = Array.from(element.children)

  const recursableTags = ['UL', 'OL', 'LI']
  const shouldRecurseIntoChildren = recursableTags.includes(element.tagName)

  if (shouldRecurseIntoChildren) {
    for (const child of children) {
      const isLeaf = child.children.length === 0
      if (isLeaf) {
        continue
      }
      if (!recursableTags.includes(child.tagName)) {
        continue
      }
      const childResult = elementContainingEventLocation(anchorElem, child as HTMLElement, eventLocation)

      if (childResult.contains.result) {
        return childResult
      }
    }
  }

  return { contains: rect.contains(eventLocation), element: element }
}

function getBlockElement(anchorElem: HTMLElement, editor: LexicalEditor, eventLocation: Point): HTMLElement | null {
  const topLevelNodeKeys = getTopLevelNodeKeys(editor)

  let blockElem: HTMLElement | null = null

  editor.getEditorState().read(() => {
    let index = getCurrentIndex(topLevelNodeKeys.length)
    let direction = Indeterminate

    while (index >= 0 && index < topLevelNodeKeys.length) {
      const key = topLevelNodeKeys[index]
      const elem = editor.getElementByKey(key)
      if (elem === null) {
        break
      }

      const { contains, element } = elementContainingEventLocation(anchorElem, elem, eventLocation)

      if (contains.result && DRAGGABLE_ELEMENTS.includes(element.tagName)) {
        blockElem = element
        prevIndex = index
        break
      }

      if (direction === Indeterminate) {
        if (contains.reason.isOnTopSide) {
          direction = Upward
        } else if (contains.reason.isOnBottomSide) {
          direction = Downward
        } else {
          // stop search block element
          direction = Infinity
        }
      }

      index += direction
    }
  })

  return blockElem
}

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`)
}

function setMenuPosition(targetElem: HTMLElement | null, floatingElem: HTMLElement, anchorElem: HTMLElement) {
  if (!targetElem) {
    floatingElem.style.opacity = '0'
    return
  }

  const targetRect = targetElem.getBoundingClientRect()
  const targetStyle = window.getComputedStyle(targetElem)
  const floatingElemRect = floatingElem.getBoundingClientRect()
  const anchorElementRect = anchorElem.getBoundingClientRect()

  const top =
    targetRect.top +
    (parseInt(targetStyle.lineHeight, 10) - floatingElemRect.height) / 2 -
    anchorElem.scrollTop -
    anchorElementRect.top

  const left = anchorElementRect.left

  floatingElem.style.opacity = '1'
  floatingElem.style.transform = `translate(${left}px, ${top}px)`
}

function setDragImage(dataTransfer: DataTransfer, draggableBlockElem: HTMLElement) {
  const { transform } = draggableBlockElem.style

  // Remove dragImage borders
  draggableBlockElem.style.transform = 'translateZ(0)'
  dataTransfer.setDragImage(draggableBlockElem, 0, 0)

  setTimeout(() => {
    draggableBlockElem.style.transform = transform
  })
}

function setTargetLine(
  targetLineElem: HTMLElement,
  targetBlockElem: HTMLElement,
  mouseY: number,
  anchorElem: HTMLElement,
) {
  const anchorStyle = window.getComputedStyle(anchorElem)
  const targetStyle = window.getComputedStyle(targetBlockElem)
  const { top: targetBlockElemTop, height: targetBlockElemHeight } = targetBlockElem.getBoundingClientRect()
  const { top: anchorTop, width: anchorWidth, left: anchorLeft } = anchorElem.getBoundingClientRect()

  let lineTop = targetBlockElemTop
  // At the bottom of the target
  if (mouseY - targetBlockElemTop > targetBlockElemHeight / 2) {
    lineTop += targetBlockElemHeight + parseFloat(targetStyle.marginBottom)
  } else {
    lineTop -= parseFloat(targetStyle.marginTop)
  }

  const top = lineTop - anchorElem.scrollTop - anchorTop - targetLineElem.offsetHeight / 2

  const paddingLeft = parseFloat(anchorStyle.paddingLeft)
  const paddingRight = parseFloat(anchorStyle.paddingRight)

  const left = anchorLeft + paddingLeft

  targetLineElem.style.transform = `translate(${left}px, ${top}px)`
  targetLineElem.style.width = `${anchorWidth - (paddingLeft + paddingRight)}px`
  targetLineElem.style.opacity = '.5'
}

function hideTargetLine(targetLineElem: HTMLElement | null) {
  if (targetLineElem) {
    targetLineElem.style.opacity = '0'
  }
}

function useDraggableBlockMenu(editor: LexicalEditor, showGenericAlertModal: (message: string) => void): JSX.Element {
  const anchorElem = editor.getRootElement()
  const menuRef = useRef<HTMLDivElement>(null)
  const targetLineRef = useRef<HTMLDivElement>(null)
  const [draggableBlockElem, setDraggableBlockElem] = useState<HTMLElement | null>(null)
  const dragDataRef = useRef<string | null>(null)

  useEffect(() => {
    if (!anchorElem) {
      return
    }

    function onMouseMove(event: MouseEvent) {
      const target = event.target
      if (!isHTMLElement(target)) {
        setDraggableBlockElem(null)
        return
      }

      if (isOnMenu(target)) {
        return
      }

      if (!anchorElem) {
        return
      }

      const _draggableBlockElem = getBlockElement(anchorElem, editor, new Point(event.clientX, event.clientY))

      setDraggableBlockElem(_draggableBlockElem)
    }

    function onMouseLeave(event: MouseEvent) {
      const relatedTarget = event.relatedTarget
      if (isHTMLElement(relatedTarget) && isOnMenu(relatedTarget)) {
        return
      }
      setDraggableBlockElem(null)
    }

    anchorElem.addEventListener('mousemove', onMouseMove)
    anchorElem.addEventListener('mouseleave', onMouseLeave)

    return () => {
      anchorElem.removeEventListener('mousemove', onMouseMove)
      anchorElem.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [anchorElem, editor])

  useEffect(() => {
    if (!anchorElem) {
      return
    }
    if (menuRef.current) {
      setMenuPosition(draggableBlockElem, menuRef.current, anchorElem)
    }
  }, [anchorElem, draggableBlockElem])

  const insertDraggedNode = useCallback(
    (draggedNode: LexicalNode, targetNode: LexicalNode, targetBlockElem: HTMLElement, pageY: number) => {
      let nodeToInsert = draggedNode
      const targetParent = targetNode.getParent()
      const sourceParent = draggedNode.getParent()

      if ($isListNode(sourceParent) && !$isListNode(targetParent)) {
        const newList = $createListNode(sourceParent.getListType())
        newList.append(draggedNode)
        nodeToInsert = newList
      }

      const { top, height } = targetBlockElem.getBoundingClientRect()
      const shouldInsertAfter = pageY - top > height / 2
      if (shouldInsertAfter) {
        targetNode.insertAfter(nodeToInsert)
      } else {
        targetNode.insertBefore(nodeToInsert)
      }
    },
    [],
  )

  useEffect(() => {
    function onDragover(event: DragEvent): boolean {
      const [isFileTransfer] = eventFiles(event)
      if (isFileTransfer) {
        return false
      }
      const { pageY, target } = event
      if (!isHTMLElement(target)) {
        return false
      }
      if (!draggedNodeKey) {
        return false
      }
      if (!anchorElem) {
        return false
      }
      const targetBlockElem = getBlockElement(anchorElem, editor, new Point(event.pageX, pageY))
      const targetLineElem = targetLineRef.current
      if (targetBlockElem === null || targetLineElem === null) {
        return false
      }
      setTargetLine(targetLineElem, targetBlockElem, pageY, anchorElem)
      // Prevent default event to be able to trigger onDrop events
      event.preventDefault()
      return true
    }

    function onDrop(event: DragEvent): boolean {
      const [isFileTransfer] = eventFiles(event)
      if (isFileTransfer) {
        return false
      }

      const { target, dataTransfer, pageY } = event
      if (!isHTMLElement(target)) {
        return false
      }

      const dragData = dataTransfer?.getData(DRAG_DATA_FORMAT) || ''
      const draggedNode = $getNodeByKey(dragData)
      if (!draggedNode) {
        return false
      }

      if (!anchorElem) {
        return false
      }

      const targetBlockElem = getBlockElement(anchorElem, editor, new Point(event.pageX, pageY))
      if (!targetBlockElem) {
        return false
      }

      const targetNode = $getNearestNodeFromDOMNode(targetBlockElem)
      if (!targetNode) {
        return false
      }
      if (targetNode === draggedNode) {
        return true
      }

      insertDraggedNode(draggedNode, targetNode, targetBlockElem, event.pageY)

      setDraggableBlockElem(null)

      return true
    }

    function onDragEnd(): boolean {
      hideTargetLine(targetLineRef.current)
      draggedNodeKey = ''
      return true
    }

    function onPaste(event: ClipboardEvent) {
      const paste = event.clipboardData?.getData('Text') || ''
      if (new Blob([paste]).size > PASTE_LIMIT_BYTES) {
        showGenericAlertModal(
          c('Info')
            .t`The content you are attempting to paste is too large to be pasted at once. Try again by pasting in smaller pieces at a time.`,
        )
        event.preventDefault()
        return true
      }
      return false
    }

    return mergeRegister(
      editor.registerCommand(
        DRAGOVER_COMMAND,
        (event) => {
          return onDragover(event)
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        DRAGEND_COMMAND,
        () => {
          return onDragEnd()
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        DROP_COMMAND,
        (event) => {
          return onDrop(event)
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand<ClipboardEvent>(
        PASTE_COMMAND,
        (event: ClipboardEvent) => {
          return onPaste(event)
        },
        COMMAND_PRIORITY_HIGH,
      ),
    )
  }, [anchorElem, editor, insertDraggedNode])

  function onDragStart(event: ReactDragEvent<HTMLDivElement>): void {
    const dataTransfer = event.dataTransfer
    if (!dataTransfer || !draggableBlockElem) {
      return
    }
    setDragImage(dataTransfer, draggableBlockElem)
    let nodeKey = ''
    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(draggableBlockElem)
      if (node) {
        nodeKey = node.getKey()
      }
    })
    dataTransfer.setData(DRAG_DATA_FORMAT, nodeKey)
    draggedNodeKey = nodeKey
  }

  function onDragEnd(): void {
    hideTargetLine(targetLineRef.current)
    draggedNodeKey = ''
  }

  function onTouchStart(): void {
    if (!draggableBlockElem) {
      return
    }
    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(draggableBlockElem)
      if (!node) {
        return
      }
      const nodeKey = node.getKey()
      dragDataRef.current = nodeKey
    })
  }

  function onTouchMove(event: TouchEvent) {
    const { pageX, pageY } = event.targetTouches[0]
    if (!anchorElem) {
      return
    }
    const { top, bottom } = anchorElem.getBoundingClientRect()
    const scrollOffset = 20
    if (pageY - top < scrollOffset) {
      anchorElem.scrollTop -= scrollOffset
    } else if (bottom - pageY < scrollOffset) {
      anchorElem.scrollTop += scrollOffset
    }
    const targetBlockElem = getBlockElement(anchorElem, editor, new Point(pageX, pageY))
    const targetLineElem = targetLineRef.current
    if (targetBlockElem === null || targetLineElem === null) {
      return
    }
    setTargetLine(targetLineElem, targetBlockElem, pageY, anchorElem)
  }

  function onTouchEnd(event: TouchEvent): void {
    hideTargetLine(targetLineRef.current)

    editor.update(() => {
      const { pageX, pageY } = event.changedTouches[0]

      const dragData = dragDataRef.current || ''
      const draggedNode = $getNodeByKey(dragData)
      if (!draggedNode) {
        return
      }

      if (!anchorElem) {
        return
      }

      const targetBlockElem = getBlockElement(anchorElem, editor, new Point(pageX, pageY))
      if (!targetBlockElem) {
        return
      }
      const targetNode = $getNearestNodeFromDOMNode(targetBlockElem)

      if (!targetNode) {
        return
      }
      if (targetNode === draggedNode) {
        return
      }

      insertDraggedNode(draggedNode, targetNode, targetBlockElem, pageY)
    })

    setDraggableBlockElem(null)
  }

  return createPortal(
    <>
      <div
        className={clsx(
          DRAGGABLE_BLOCK_MENU_CLASSNAME,
          'absolute left-0 top-0 flex items-center justify-center rounded py-0.5 opacity-0 hover:bg-[--background-weak]',
        )}
        style={{
          transition: 'opacity 0.2s',
        }}
        ref={menuRef}
        draggable={true}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Icon name="dots" className="text-norm pointer-events-none" />
      </div>
      <div className="draggable-block-target-line" ref={targetLineRef} />
    </>,
    anchorElem?.parentElement || document.body,
  )
}

export default function DraggableBlockPlugin({
  showGenericAlertModal,
}: {
  showGenericAlertModal: (message: string) => void
}): JSX.Element {
  const [editor] = useLexicalComposerContext()
  return useDraggableBlockMenu(editor, showGenericAlertModal)
}
