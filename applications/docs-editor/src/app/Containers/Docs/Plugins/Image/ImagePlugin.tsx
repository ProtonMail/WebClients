import { useEffect } from 'react'
import { c } from 'ttag'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils'
import type { LexicalNode, NodeKey } from 'lexical'
import {
  $createParagraphNode,
  $createRangeSelection,
  $getNodeByKey,
  $getSelection,
  $insertNodes,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  PASTE_COMMAND,
  SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
} from 'lexical'
import { eventFiles } from '@lexical/rich-text'

import { $createImageNode, ImageNode } from './ImageNode'
import { $isImageNode } from './isImageNode'
import { INSERT_IMAGE_NODE_COMMAND, SET_IMAGE_SIZE_COMMAND } from './ImageCommands'
export { INSERT_IMAGE_NODE_COMMAND, SET_IMAGE_SIZE_COMMAND } from './ImageCommands'
export type { SetImageSizePayload } from './ImageCommands'

import { useDocsDependencies } from '../../DocsDependenciesProvider'
import { $canDropImage, $getImageNodeInSelection, getDragImageData, getDragSelection } from './ImageUtils'
import { INSERT_FILE_COMMAND } from '../../Commands/Events'
import { hasBlockedImageInClipboard } from './hasBlockedImageInClipboard'
import { isImage, isSupportedImage, prepareImageSource, toBase64 } from './imagePreparation'

type InsertImagePayload = File | Blob

function $isImageNodeWithBlobSrc(node: LexicalNode): node is ImageNode {
  return $isImageNode(node) && node.getSrc().startsWith('blob:')
}

const dragImage = new Image()

export default function ImagesPlugin({
  createWarningNotification,
}: {
  createWarningNotification: (message: string) => void
}): JSX.Element | null {
  const { reportError } = useDocsDependencies()
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error('ImagesPlugin: ImageNode not registered on editor')
    }

    return mergeRegister(
      editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          if (
            editor.isEditable() &&
            event &&
            'clipboardData' in event &&
            hasBlockedImageInClipboard(event.clipboardData, editor._config.namespace)
          ) {
            createWarningNotification(
              c('Warning')
                .t`Pasting remote images is not supported. Download the image and use "Insert image" instead.`,
            )
          }
          // Let normal paste handling keep the supported content, including in suggestion mode.
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
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
          if (!isSupportedImage(payload.type)) {
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
            createAndInsertImageNode(await prepareImageSource(payload))
          }

          handleDownsizingAndInsert().catch(reportError)
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
      editor.registerCommand(
        SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
        ({ nodes, selection }) => {
          const blobSrcImageNodes = nodes.filter($isImageNodeWithBlobSrc)
          if (!blobSrcImageNodes.length) {
            return false
          }
          selection.insertNodes(nodes)
          async function convertSourcesAndInsertNodes() {
            const convertedSources = new Map<NodeKey, string>()
            for (const image of blobSrcImageNodes) {
              const key = image.__key
              const src = image.__src
              if (!src.startsWith('blob:')) {
                continue
              }
              const blob = await (await fetch(src)).blob()
              const base64 = await toBase64(blob)
              convertedSources.set(key, base64)
            }
            editor.update(() => {
              const selection = $getSelection()
              if (!selection) {
                return
              }
              for (const [key, src] of convertedSources) {
                const node = $getNodeByKey<ImageNode>(key)
                if (!node) {
                  continue
                }
                node.getWritable().__src = src
              }
            })
          }
          convertSourcesAndInsertNodes().catch(reportError)
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, createWarningNotification, reportError])

  return null
}

declare global {
  interface DragEvent {
    rangeOffset?: number
    rangeParent?: Node
  }
}
