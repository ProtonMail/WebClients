import { useEffect } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $wrapNodeInElement, CAN_USE_DOM, mergeRegister } from '@lexical/utils'
import {
  $createParagraphNode,
  $createRangeSelection,
  $getEditor,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  LexicalCommand,
  createCommand,
} from 'lexical'

import { $createImageNode, $isImageNode, ImageNode, SerializedImageNode } from './ImageNode'

import { toBase64 } from '@proton/shared/lib/helpers/file'
import { downSize } from '@proton/shared/lib/helpers/image'
import { sendErrorMessage } from '../../Utils/errorMessage'

type InsertImagePayload = File | Blob

const FIVE_HUNDRED_KILO_BYTES = 500 * 1024

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> = createCommand('INSERT_IMAGE_COMMAND')

function $getImageNodeInSelection(): ImageNode | null {
  const selection = $getSelection()
  if (!$isNodeSelection(selection)) {
    return null
  }
  const nodes = selection.getNodes()
  const node = nodes[0]
  return $isImageNode(node) ? node : null
}

const dragImage = new Image()

export default function ImagesPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error('ImagesPlugin: ImageNode not registered on editor')
    }

    return mergeRegister(
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          function createAndInsertImageNode(src: string) {
            editor.update(() => {
              const imageNode = $createImageNode({
                src,
                altText: '',
              })
              $insertNodes([imageNode])
              if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
                $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd()
              }
            })
          }

          async function handleDownsizingAndInsert() {
            const base64 = await toBase64(payload)

            if (payload.size <= FIVE_HUNDRED_KILO_BYTES) {
              createAndInsertImageNode(base64)
              return
            }

            const downsizedImage = await downSize(base64, FIVE_HUNDRED_KILO_BYTES, payload.type)
            createAndInsertImageNode(downsizedImage)
          }

          handleDownsizingAndInsert().catch(sendErrorMessage)
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        (event) => {
          const imageNode = $getImageNodeInSelection()
          if (!imageNode) {
            return false
          }
          const dataTransfer = event.dataTransfer
          if (!dataTransfer) {
            return false
          }
          const nodeJSON = imageNode.exportJSON()
          dataTransfer.setData('text/plain', '')
          dataTransfer.setDragImage(dragImage, 0, 0)
          dataTransfer.setData(
            'application/x-lexical-drag',
            JSON.stringify({
              type: nodeJSON.type,
              data: {
                ...nodeJSON,
              },
            }),
          )
          return false
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          const node = $getImageNodeInSelection()
          if (!node) {
            return false
          }
          if (!$canDropImage(event)) {
            event.preventDefault()
          }
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        DROP_COMMAND,
        (event) => {
          const draggedImageNode = $getImageNodeInSelection()
          if (draggedImageNode) {
            const data = getDragImageData(event)
            if (!data) {
              return false
            }
            event.preventDefault()
            if ($canDropImage(event)) {
              const range = getDragSelection(event)
              draggedImageNode.remove()
              const rangeSelection = $createRangeSelection()
              if (range !== null && range !== undefined) {
                rangeSelection.applyDOMRange(range)
              }
              $setSelection(rangeSelection)
              const imageNode = $createImageNode({
                altText: data.altText,
                height: data.height,
                maxWidth: data.maxWidth,
                width: data.width,
                src: data.src,
              })
              $insertNodes([imageNode])
            }
            return true
          }
          if (!event.dataTransfer) {
            return false
          }
          const files = event.dataTransfer.files
          if (files.length === 0) {
            return false
          }
          for (const file of files) {
            const isImage = file.type.startsWith('image/')
            if (!isImage) {
              continue
            }
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, file)
          }
          return false
        },
        COMMAND_PRIORITY_HIGH,
      ),
    )
  }, [editor])

  return null
}

function $canDropImage(event: DragEvent): boolean {
  const target = event.target
  const rootElement = $getEditor().getRootElement()
  return !!(
    target &&
    target instanceof HTMLElement &&
    !target.closest('code, span.Lexical__image') &&
    target.parentElement &&
    rootElement?.contains(target.parentElement)
  )
}

function getDragImageData(event: DragEvent): null | SerializedImageNode {
  const dragData = event.dataTransfer?.getData('application/x-lexical-drag')
  if (!dragData) {
    return null
  }
  const { type, data } = JSON.parse(dragData)
  if (type !== 'image') {
    return null
  }
  return data
}

const getDOMSelection = (targetWindow: Window | null): Selection | null =>
  CAN_USE_DOM ? (targetWindow || window).getSelection() : null

declare global {
  interface DragEvent {
    rangeOffset?: number
    rangeParent?: Node
  }
}

function getDragSelection(event: DragEvent): Range | null | undefined {
  let range
  const target = event.target as null | Element | Document
  const targetWindow =
    target == null
      ? null
      : target.nodeType === 9
        ? (target as Document).defaultView
        : (target as Element).ownerDocument.defaultView
  const domSelection = getDOMSelection(targetWindow)
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY)
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0)
    range = domSelection.getRangeAt(0)
  } else {
    throw Error(`Cannot get the selection when dragging`)
  }

  return range
}
