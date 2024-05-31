import {
  $isTextNode,
  $createTextNode,
  COMMAND_PRIORITY_LOW,
  LexicalEditor,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
  TextNode,
  $getSelection,
  $isRangeSelection,
  $insertNodes,
} from 'lexical'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSelectedNode } from '../../Utils/getSelectedNode'
import { $createLinkNode, $isLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { getDOMRangeRect } from '../../Utils/getDOMRangeRect'
import { sanitizeUrl } from '../../Utils/sanitizeUrl'
import { createPortal } from 'react-dom'
import { Button, Input } from '@proton/atoms'
import { Icon } from '@proton/components'
import { mergeRegister } from '@lexical/utils'
import { c } from 'ttag'

export const $isLinkTextNode = (
  node: ReturnType<typeof getSelectedNode>,
  selection: RangeSelection,
): node is TextNode => {
  const parent = node.getParent()
  return (
    $isLinkNode(parent) &&
    parent.getChildrenSize() === 1 &&
    $isTextNode(node) &&
    parent.getFirstChild() === node &&
    selection.anchor.getNode() === selection.focus.getNode()
  )
}

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
    editor.update(
      () => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) {
          return
        }

        const isSelectionCollapsed = selection.isCollapsed()
        if (isSelectionCollapsed && !!url && !linkNode) {
          const sanitizedURL = sanitizeUrl(url)
          const linkNode = $createLinkNode(sanitizedURL)
          const textNode = $createTextNode(text || url)
          linkNode.append(textNode)
          $insertNodes([linkNode])
          linkNode.selectEnd()
          return
        }

        if (url !== '') {
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl(url))
        }

        if (linkTextNode !== null && text !== '') {
          linkTextNode.setTextContent(text)
        }
      },
      {
        onUpdate: () => {
          setIsEditingLink(false)
        },
      },
    )
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

    if (linkNodeDOM) {
      const linkNodeRect = linkNodeDOM.getBoundingClientRect()

      setPosition({
        top: linkNodeRect.bottom + rootParent.scrollTop - rootParent.getBoundingClientRect().top + 10,
        left: linkNodeRect.left,
      })
    } else {
      const nativeSelection = window.getSelection()
      const rootElement = editor.getRootElement()

      if (nativeSelection !== null && rootElement !== null && rootElement.contains(nativeSelection.anchorNode)) {
        const rangeRect = getDOMRangeRect(nativeSelection, rootElement)

        setPosition({
          top: rangeRect.bottom + rootParent.scrollTop - rootParent.getBoundingClientRect().top + 10,
          left: rangeRect.left,
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
      className="bg-norm shadow-norm border-weak absolute left-0 top-0 rounded border px-3 py-1.5 text-sm"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
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
            <Icon name="info-circle" className="flex-shrink-0" />
            <Input
              aria-label={c('Label').t`Link text`}
              value={text}
              onChange={(event) => {
                setText(event.target.value)
              }}
            />
          </div>
        )}
        <div className="flex items-center gap-3">
          <Icon name="link" className="flex-shrink-0" />
          <Input
            value={url}
            aria-label={c('Label').t`Link URL`}
            onChange={(event) => {
              setURL(event.target.value)
            }}
            ref={focusInputOnMount}
          />
        </div>
        <div className="flex items-center justify-end gap-1.5">
          <Button shape="ghost" onClick={cancelLinkEdit}>{c('Action').t`Cancel`}</Button>
          <Button type="submit">{c('Action').t`Apply`}</Button>
        </div>
      </form>
    </div>,
    containerElement ?? document.body,
  )
}
