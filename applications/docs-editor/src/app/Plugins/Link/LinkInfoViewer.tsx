import { $isAutoLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { mergeRegister } from '@lexical/utils'
import { COMMAND_PRIORITY_LOW, LexicalEditor, SELECTION_CHANGE_COMMAND } from 'lexical'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getDOMRangeRect } from '../../Utils/getDOMRangeRect'
import clsx from '@proton/utils/clsx'
import { Icon, Tooltip, usePopper } from '@proton/components'
import { Button } from '@proton/atoms'
import { createPortal } from 'react-dom'

type Props = {
  linkNode: LinkNode
  editor: LexicalEditor
  setIsEditingLink: (isEditingLink: boolean) => void
}

export function LinkInfoViewer({ editor, linkNode, setIsEditingLink }: Props) {
  const [linkNodePosition, setLinkNodePosition] = useState<{
    top: number
    left: number
  } | null>(null)

  const { position, floating } = usePopper({
    isOpen: true,
    originalPlacement: 'bottom-start',
    offset: 6,
    reference: {
      mode: 'position',
      value: linkNodePosition ? { top: linkNodePosition.top, left: linkNodePosition.left } : null,
    },
  })

  const [linkUrl, isAutoLink] = useMemo(() => {
    let linkUrl = ''
    let isAutoLink = false
    editor.getEditorState().read(() => {
      linkUrl = linkNode.getURL()
      isAutoLink = $isAutoLinkNode(linkNode)
    })
    return [linkUrl, isAutoLink]
  }, [editor, linkNode])

  const linkNodeDOM = useMemo(() => {
    return editor.getElementByKey(linkNode.getKey())
  }, [editor, linkNode])

  const rangeRect = useRef<DOMRect>()
  const updatePosition = useCallback(() => {
    const nativeSelection = window.getSelection()
    const rootElement = editor.getRootElement()

    if (nativeSelection !== null && rootElement !== null) {
      if (rootElement.contains(nativeSelection.anchorNode)) {
        rangeRect.current = getDOMRangeRect(nativeSelection, rootElement)
      }
    }

    if (!rootElement) {
      return
    }

    if (!linkNodeDOM) {
      return
    }

    const linkNodeRect = linkNodeDOM.getBoundingClientRect()

    setLinkNodePosition({
      top: linkNodeRect.top + linkNodeRect.height,
      left: linkNodeRect.left,
    })
  }, [editor, linkNodeDOM])

  useEffect(() => {
    updatePosition()

    return mergeRegister(
      editor.registerUpdateListener(() => {
        updatePosition()
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload) => {
          updatePosition()
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, updatePosition])

  if (!linkUrl) {
    return null
  }

  const containerElement = editor.getRootElement()?.parentElement

  return createPortal(
    <div
      className="absolute left-0 top-0 rounded bg-[--background-norm] px-2.5 py-1.5"
      style={{
        top: position.top,
        left: position.left,
      }}
      ref={floating}
    >
      <div className="flex items-center gap-1.5">
        <a
          className={clsx(
            'mr-1 flex flex-grow items-center gap-2 overflow-hidden whitespace-nowrap text-sm underline',
            isAutoLink && 'py-2.5',
          )}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="arrow-out-square" className="ml-1 flex-shrink-0" />
          <div className="max-w-[35ch] overflow-hidden text-ellipsis">{linkUrl}</div>
        </a>
        <Tooltip title="Copy link">
          <Button
            icon
            size="small"
            shape="ghost"
            onClick={() => {
              navigator.clipboard.writeText(linkUrl).catch(console.error)
            }}
          >
            <Icon name="link" />
          </Button>
        </Tooltip>
        {!isAutoLink && (
          <>
            <Tooltip title="Remove link">
              <Button
                icon
                size="small"
                shape="ghost"
                onClick={() => {
                  editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
                }}
              >
                <Icon name="trash" />
              </Button>
            </Tooltip>
          </>
        )}
      </div>
    </div>,
    containerElement || document.body,
  )
}
