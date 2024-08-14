import * as React from 'react'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { mergeRegister } from '@lexical/utils'
import type { BaseSelection, LexicalCommand, LexicalEditor, NodeKey } from 'lexical'
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DRAGSTART_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
  createCommand,
} from 'lexical'

import { $isImageNode } from './ImageNode'
import { useCombinedRefs } from '@proton/hooks'
import ImageResizer from './ImageResizer'
import { getElementDimensionsWithoutPadding } from '../../Utils/getEditorWidthWithoutPadding'
import { CircleLoader } from '@proton/atoms'

const imageCache = new Set()

export const RIGHT_CLICK_IMAGE_COMMAND: LexicalCommand<MouseEvent> = createCommand('RIGHT_CLICK_IMAGE_COMMAND')

function useSuspenseImage(src: string) {
  if (!imageCache.has(src)) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw new Promise((resolve) => {
      const img = new Image()
      img.src = src
      img.onload = () => {
        imageCache.add(src)
        resolve(null)
      }
    })
  }
}

function LazyImage({
  altText,
  className,
  imageRef,
  src,
  width,
  height,
  maxWidth,
  editor,
}: {
  altText: string
  className: string | null
  height: 'inherit' | number
  imageRef: { current: null | HTMLImageElement }
  maxWidth: number | null
  src: string
  width: 'inherit' | number
  editor: LexicalEditor
}): JSX.Element {
  const [imgWidth, setImgWidth] = useState<number | 'inherit'>(width)
  const [imgHeight, setImgHeight] = useState<number | 'inherit'>(height)

  useEffect(() => {
    setImgWidth(width)
    setImgHeight(height)
  }, [width, height])

  useSuspenseImage(src)

  return (
    <img
      className={className || undefined}
      src={src}
      alt={altText}
      ref={useCombinedRefs(imageRef, (image) => {
        const editorDimensions = getElementDimensionsWithoutPadding(editor.getRootElement())
        if (image && editorDimensions) {
          const naturalWidth = image.naturalWidth
          if (image.style.width === 'inherit') {
            if (naturalWidth > editorDimensions.width) {
              setImgWidth(editorDimensions.width)
            } else {
              setImgWidth(naturalWidth)
            }
          }
          if (image.style.height === 'inherit') {
            if (naturalWidth < editorDimensions.width) {
              setImgHeight(image.naturalHeight)
            }
          }
        }
      })}
      style={{
        height: imgHeight === 'inherit' ? 'inherit' : `${imgHeight}px`,
        maxWidth: maxWidth ? `${maxWidth}px` : '100%',
        width: imgWidth === 'inherit' ? 'inherit' : `${imgWidth}px`,
      }}
      draggable="false"
    />
  )
}

export default function ImageComponent({
  src,
  altText,
  nodeKey,
  width,
  height,
  maxWidth,
  showCaption,
  caption,
}: {
  altText: string
  caption: LexicalEditor
  height: 'inherit' | number
  maxWidth: number | null
  nodeKey: NodeKey
  resizable: boolean
  showCaption: boolean
  src: string
  width: 'inherit' | number
  captionsEnabled: boolean
}): JSX.Element {
  const [isResizing, setIsResizing] = useState(false)
  const imageRef = useRef<null | HTMLImageElement>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)
  const [editor] = useLexicalComposerContext()
  const [selection, setSelection] = useState<BaseSelection | null>(null)
  const activeEditorRef = useRef<LexicalEditor | null>(null)

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event: KeyboardEvent = payload
        event.preventDefault()
        const node = $getNodeByKey(nodeKey)
        if ($isImageNode(node)) {
          node.remove()
          return true
        }
      }
      return false
    },
    [isSelected, nodeKey],
  )

  const onEnter = useCallback(
    (event: KeyboardEvent) => {
      const latestSelection = $getSelection()
      const buttonElem = buttonRef.current
      if (isSelected && $isNodeSelection(latestSelection) && latestSelection.getNodes().length === 1) {
        if (showCaption) {
          // Move focus into nested editor
          $setSelection(null)
          event.preventDefault()
          caption.focus()
          return true
        } else if (buttonElem !== null && buttonElem !== document.activeElement) {
          event.preventDefault()
          buttonElem.focus()
          return true
        }
      }
      return false
    },
    [caption, isSelected, showCaption],
  )

  const onEscape = useCallback(
    (event: KeyboardEvent) => {
      if (activeEditorRef.current === caption || buttonRef.current === event.target) {
        $setSelection(null)
        editor.update(() => {
          setSelected(true)
          const parentRootElement = editor.getRootElement()
          if (parentRootElement !== null) {
            parentRootElement.focus()
          }
        })
        return true
      }
      return false
    },
    [caption, editor, setSelected],
  )

  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload
      if (event.target === imageRef.current) {
        if (event.shiftKey) {
          setSelected(!isSelected)
        } else {
          clearSelection()
          setSelected(true)
        }
        return true
      }

      return false
    },
    [isSelected, setSelected, clearSelection],
  )

  const onRightClick = useCallback(
    (event: MouseEvent): void => {
      editor.getEditorState().read(() => {
        const latestSelection = $getSelection()
        const domElement = event.target as HTMLElement
        if (
          domElement.tagName === 'IMG' &&
          $isRangeSelection(latestSelection) &&
          latestSelection.getNodes().length === 1
        ) {
          editor.dispatchCommand(RIGHT_CLICK_IMAGE_COMMAND, event as MouseEvent)
        }
      })
    },
    [editor],
  )

  useEffect(() => {
    let isMounted = true
    const rootElement = editor.getRootElement()
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        if (isMounted) {
          const selection = editorState.read(() => $getSelection())
          setSelection(selection)
        }
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<MouseEvent>(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW),
      editor.registerCommand<MouseEvent>(RIGHT_CLICK_IMAGE_COMMAND, onClick, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === imageRef.current) {
            // TODO This is just a temporary workaround for FF to behave like other browsers.
            // Ideally, this handles drag & drop too (and all browsers).
            event.preventDefault()
            return true
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ESCAPE_COMMAND, onEscape, COMMAND_PRIORITY_LOW),
    )

    rootElement?.addEventListener('contextmenu', onRightClick)

    return () => {
      isMounted = false
      unregister()
      rootElement?.removeEventListener('contextmenu', onRightClick)
    }
  }, [clearSelection, editor, isSelected, nodeKey, onDelete, onEnter, onEscape, onClick, onRightClick, setSelected])

  const draggable = isSelected && $isNodeSelection(selection) && !isResizing
  const isFocused = isSelected || isResizing

  const onResizeEnd = (nextWidth: 'inherit' | number, nextHeight: 'inherit' | number) => {
    // Delay hiding the resize bars for click case
    setTimeout(() => {
      setIsResizing(false)
    }, 200)

    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isImageNode(node)) {
        node.setWidthAndHeight(nextWidth, nextHeight)
      }
    })
  }

  const onResizeStart = () => {
    setIsResizing(true)
  }

  return (
    <Suspense
      fallback={
        <div
          className="flex items-center justify-center"
          style={{
            width,
            height,
          }}
        >
          <CircleLoader
            style={{
              width: '15%',
              height: '15%',
            }}
          />
        </div>
      }
    >
      <div draggable={draggable}>
        <LazyImage
          className={
            isFocused ? `focused ${$isNodeSelection(selection) ? 'cursor-grab active:cursor-grabbing' : ''}` : null
          }
          src={src}
          altText={altText}
          imageRef={imageRef}
          width={width}
          height={height}
          maxWidth={maxWidth}
          editor={editor}
        />
      </div>
      {isFocused && (
        <ImageResizer editor={editor} imageRef={imageRef} onResizeStart={onResizeStart} onResizeEnd={onResizeEnd} />
      )}
    </Suspense>
  )
}
