import { useEffect } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils'
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  DROP_COMMAND,
  LexicalCommand,
  createCommand,
} from 'lexical'

import { $createImageNode, ImageNode } from './ImageNode'

import { toBase64 } from '@proton/shared/lib/helpers/file'
import { downSize } from '@proton/shared/lib/helpers/image'
import { sendErrorMessage } from '../../Utils/errorMessage'

type InsertImagePayload = File | Blob

const FIVE_HUNDRED_KILO_BYTES = 500 * 1024

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> = createCommand('INSERT_IMAGE_COMMAND')

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
      editor.registerCommand(
        DROP_COMMAND,
        (payload) => {
          if (!payload.dataTransfer) {
            return false
          }
          const files = payload.dataTransfer.files
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
