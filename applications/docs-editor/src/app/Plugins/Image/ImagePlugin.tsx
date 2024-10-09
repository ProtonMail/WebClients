import { useEffect } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils'
import type { LexicalCommand, LexicalNode, NodeKey } from 'lexical'
import {
  $createParagraphNode,
  $createRangeSelection,
  $getNodeByKey,
  $getSelection,
  $insertNodes,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  PASTE_COMMAND,
  createCommand,
} from 'lexical'
import { eventFiles } from '@lexical/rich-text'

import { $createImageNode, $isImageNode, ImageNode } from './ImageNode'

import { toBase64 } from '@proton/shared/lib/helpers/file'
import { downSize } from '@proton/shared/lib/helpers/image'
import { sendErrorMessage } from '../../Utils/errorMessage'
import { isImage } from '@proton/shared/lib/helpers/mimetype'
import { $canDropImage, $getImageNodeInSelection, getDragImageData, getDragSelection } from './ImageUtils'
import { INSERT_FILE_COMMAND } from '../../Commands/Events'

type InsertImagePayload = File | Blob

const FIVE_HUNDRED_KILO_BYTES = 500 * 1024

export const INSERT_IMAGE_NODE_COMMAND: LexicalCommand<LexicalNode> = createCommand('INSERT_IMAGE_NODE_COMMAND')

export type SetImageSizePayload = {
  nodeKey: NodeKey
  width: number | 'inherit'
  height: number | 'inherit'
}

export const SET_IMAGE_SIZE_COMMAND: LexicalCommand<SetImageSizePayload> = createCommand('SET_IMAGE_SIZE_COMMAND')

const dragImage = new Image()

export default function ImagesPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error('ImagesPlugin: ImageNode not registered on editor')
    }

    return mergeRegister(
      editor.registerCommand(
        SET_IMAGE_SIZE_COMMAND,
        ({ nodeKey, width, height }) => {
          const node = $getNodeByKey(nodeKey)
          if (!$isImageNode(node)) {
            return false
          }
          node.setWidthAndHeight(width, height)
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        INSERT_IMAGE_NODE_COMMAND,
        (node) => {
          $insertNodes([node])
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<InsertImagePayload>(
        INSERT_FILE_COMMAND,
        (payload) => {
          if (!isImage(payload.type)) {
            return false
          }

          function createAndInsertImageNode(src: string) {
            editor.update(() => {
              const selection = $getSelection()
              if (!selection) {
                return
              }
              const imageNode = $createImageNode({
                src,
                altText: '',
              })
              editor.dispatchCommand(INSERT_IMAGE_NODE_COMMAND, imageNode)
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
              editor.dispatchCommand(INSERT_IMAGE_NODE_COMMAND, imageNode)
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
            editor.dispatchCommand(INSERT_FILE_COMMAND, file)
          }
          return false
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          const [, files, hasTextContent] = eventFiles(event)
          if (files.length > 0 && !hasTextContent) {
            for (const file of files) {
              if (!isImage(file.type)) {
                continue
              }
              editor.dispatchCommand(INSERT_FILE_COMMAND, file)
            }
            return true
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor])

  return null
}

declare global {
  interface DragEvent {
    rangeOffset?: number
    rangeParent?: Node
  }
}
