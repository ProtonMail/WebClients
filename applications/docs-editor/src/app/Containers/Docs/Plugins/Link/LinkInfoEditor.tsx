import type { LexicalEditor, TextNode } from 'lexical'
import { COMMAND_PRIORITY_LOW, SELECTION_CHANGE_COMMAND, $getSelection, $isRangeSelection } from 'lexical'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { LinkNode } from '@lexical/link'
import { getDOMRangeRect } from '../../Utils/getDOMRangeRect'
import { createPortal } from 'react-dom'
import { Icon } from '../../Components/Icon'
import * as Icons from '../../Components/icons'
import { mergeRegister } from '@lexical/utils'
import { useDocsMessages } from '../../DocsDependenciesProvider'
import { LINK_CHANGE_COMMAND } from './LinkPlugin'

const inputClassName =
  'min-w-0 flex-1 rounded border border-[--border-weak] bg-[--background-norm] px-3 py-1.5 text-sm text-[--text-norm] placeholder:text-[--text-weak] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--focus-outline]'
const buttonClassName =
  'inline-flex min-h-8 items-center justify-center rounded border px-3 py-1 text-sm text-[--text-norm] hover:bg-[--interaction-weak] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--focus-outline]'

export function LinkInfoEditor({
  editor,
  setIsEditingLink,
  linkNode,
  linkTextNode,
}: {
  editor: LexicalEditor
  setIsEditingLink: (isEditMode: boolean) => void
  linkNode: LinkNode | null
  linkTextNode: TextNode | null
}) {
  const messages = useDocsMessages().link
  const [position, setPosition] = useState<{
    top: number
    left: number
  } | null>(null)

  const [shouldShowLinkTextInput, setShouldShowLinkTextInput] = useState(() => linkTextNode !== null || !linkNode)

  const [url, setURL] = useState('')
  const [text, setText] = useState('')
  useEffect(() => {
    editor.getEditorState().read(() => {
      if (linkNode) {
        setURL(linkNode.getURL())
      }
      if (linkTextNode) {
        setText(linkTextNode.getTextContent())
      }
      if (!linkNode && !linkTextNode) {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) {
          return
        }
        if (!selection.isCollapsed()) {
          setShouldShowLinkTextInput(false)
          return
        }
      }
    })
  }, [editor, linkNode, linkTextNode])

  const handleSubmission = useCallback(() => {
    editor.dispatchCommand(LINK_CHANGE_COMMAND, {
      linkNode,
      linkTextNode,
      url,
      text,
    })
    setIsEditingLink(false)
  }, [editor, linkNode, linkTextNode, setIsEditingLink, text, url])

  const linkNodeDOM = useMemo(() => {
    if (!linkNode) {
      return null
    }
    return editor.getElementByKey(linkNode.getKey())
  }, [editor, linkNode])

  const updatePosition = useCallback(() => {
    const rootElement = editor.getRootElement()
    const rootParent = rootElement?.parentElement

    if (!rootElement || !rootParent) {
      return
    }

    const rootParentRect = rootParent.getBoundingClientRect()
    const leftOffset = rootParent.scrollLeft - rootParentRect.left
    const topOffset = rootParent.scrollTop - rootParentRect.top

    if (linkNodeDOM) {
      const linkNodeRect = linkNodeDOM.getBoundingClientRect()

      setPosition({
        top: linkNodeRect.bottom + topOffset + 10,
        left: linkNodeRect.left + leftOffset,
      })
    } else {
      const nativeSelection = window.getSelection()

      if (nativeSelection !== null && rootElement.contains(nativeSelection.anchorNode)) {
        const rangeRect = getDOMRangeRect(nativeSelection, rootElement)

        setPosition({
          top: rangeRect.bottom + topOffset + 10,
          left: rangeRect.left + leftOffset,
        })
      }
    }
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

  const focusInputOnMount = useCallback((input: HTMLInputElement | null) => {
    if (input) {
      input.focus()
    }
  }, [])

  const cancelLinkEdit = useCallback(() => {
    setIsEditingLink(false)
    editor.focus()
  }, [editor, setIsEditingLink])

  if (!position) {
    return null
  }

  return createPortal(
    <div
      className="bg-norm shadow-norm border-weak absolute left-0 top-0 rounded border px-3 py-1.5 text-sm print:hidden"
      style={{
        top: position.top,
        left: position.left,
      }}
      data-testid="hyperlink-form"
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <form
        className="flex flex-col gap-2 py-1"
        onSubmit={(event) => {
          event.preventDefault()
          handleSubmission()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            cancelLinkEdit()
          }
        }}
      >
        {shouldShowLinkTextInput && (
          <div className="flex items-center gap-3">
            <Icon data={Icons.infoCircle} className="flex-shrink-0" />
            <input
              type="text"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className={inputClassName}
              aria-label={messages.textLabel}
              placeholder={messages.textPlaceholder}
              value={text}
              onChange={(event) => {
                setText(event.target.value)
              }}
            />
          </div>
        )}
        <div className="flex items-center gap-3">
          <Icon data={Icons.link} className="flex-shrink-0" />
          <input
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className={inputClassName}
            value={url}
            aria-label={messages.urlLabel}
            placeholder={messages.urlPlaceholder}
            onChange={(event) => {
              setURL(event.target.value)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleSubmission()
              }
            }}
            ref={focusInputOnMount}
          />
        </div>
        <div className="flex items-center justify-end gap-1.5">
          <button type="button" className={`${buttonClassName} border-transparent`} onClick={cancelLinkEdit}>
            {messages.cancel}
          </button>
          <button type="button" className={`${buttonClassName} border-[--border-weak]`} onClick={handleSubmission}>
            {messages.apply}
          </button>
        </div>
      </form>
    </div>,
    containerElement ?? document.body,
  )
}
