import { $isAutoLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { mergeRegister } from '@lexical/utils'
import { COMMAND_PRIORITY_LOW, LexicalEditor, SELECTION_CHANGE_COMMAND } from 'lexical'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getDOMRangeRect } from '../../Utils/getDOMRangeRect'
import clsx from '@proton/utils/clsx'
import { Icon, Tooltip } from '@proton/components'
import { Button } from '@proton/atoms'
import { createPortal } from 'react-dom'
import { c } from 'ttag'
import useLexicalEditable from '@lexical/react/useLexicalEditable'
import { sendErrorMessage } from '../../Utils/errorMessage'

type Props = {
  linkNode: LinkNode
  editor: LexicalEditor
  setIsEditingLink: (isEditingLink: boolean) => void
  openLink: (url: string) => void
}

export function LinkInfoViewer({ editor, linkNode, setIsEditingLink, openLink }: Props) {
  const isEditorEditable = useLexicalEditable()

  const [position, setPosition] = useState<{
    top: number
    left: number
  }>()

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
    const rootParent = rootElement?.parentElement

    if (nativeSelection !== null && rootElement !== null) {
      if (rootElement.contains(nativeSelection.anchorNode)) {
        rangeRect.current = getDOMRangeRect(nativeSelection, rootElement)
      }
    }

    if (!rootElement || !rootParent || !linkNodeDOM) {
      return
    }

    const linkNodeRect = linkNodeDOM.getBoundingClientRect()

    setPosition({
      top: linkNodeRect.bottom + rootParent.scrollTop - rootParent.getBoundingClientRect().top + 10,
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

  const containerElement = editor.getRootElement()?.parentElement

  if (!position || !linkUrl) {
    return null
  }

  return createPortal(
    <div
      className="bg-norm shadow-norm border-weak absolute left-0 top-0 rounded border px-2.5 py-1.5"
      style={{
        top: position.top,
        left: position.left,
      }}
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
          onClick={(event) => {
            event.preventDefault()
            openLink(linkUrl)
          }}
        >
          <Icon name="arrow-out-square" className="ml-1 flex-shrink-0" />
          <div className="max-w-[35ch] overflow-hidden text-ellipsis">{linkUrl}</div>
        </a>
        <Tooltip title={c('Action').t`Copy link`}>
          <Button
            icon
            size="small"
            shape="ghost"
            onClick={() => {
              navigator.clipboard.writeText(linkUrl).catch(sendErrorMessage)
            }}
          >
            <Icon name="link" />
          </Button>
        </Tooltip>
        {!isAutoLink && isEditorEditable && (
          <>
            <Tooltip title={c('Action').t`Edit link`}>
              <Button
                icon
                size="small"
                shape="ghost"
                onClick={() => {
                  setIsEditingLink(true)
                }}
              >
                <Icon name="pencil" />
              </Button>
            </Tooltip>
            <Tooltip title={c('Action').t`Remove link`}>
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
