import * as Ariakit from '@ariakit/react'
import { $isCodeNode } from '@lexical/code'
import { $findMatchingParent } from '@lexical/utils'
import { $isNonInlineLeafElement } from '../../Utils/isNonInlineLeafElement'
import { matchEmojiShortcode } from './matchEmojiShortcode'
import { readRecentEmojis, rememberEmoji } from './recentEmojis'
/* eslint-disable jsx-a11y/prefer-tag-over-role -- Autocomplete keeps focus in the document and exposes a listbox through aria-activedescendant. */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection, $isTextNode, PASTE_TAG, type RangeSelection } from 'lexical'
import { useContext, useEffect, useId, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { createPortal } from 'react-dom'
import { defaultEmojiMessages, type EmojiMessages } from './emojiMessages'
import { loadEmojis, searchEmojis, type Emoji } from './emojiData'
import { insertEmoji } from './insertEmoji'

type Match = { query: string; closed: boolean; prefix: string; selection: RangeSelection; signature: string }

function $getEmojiContext() {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return null
  }
  const node = selection.anchor.getNode()
  if (!$isTextNode(node) || node.hasFormat('code')) {
    return null
  }
  const block = $findMatchingParent(node, $isNonInlineLeafElement)
  if (!block || $isCodeNode(block)) {
    return null
  }
  const prefixRange = selection.clone()
  prefixRange.anchor.set(block.getKey(), 0, 'element')
  return { selection, node, block, prefix: prefixRange.getTextContent() }
}

function $getMatch(): Match | null {
  const context = $getEmojiContext()
  if (!context) {
    return null
  }
  const { selection, node, block, prefix } = context
  const match = matchEmojiShortcode(prefix)
  if (!match) {
    return null
  }
  const textNodes = block.getAllTextNodes()
  let index = textNodes.findIndex((text) => text.is(node))
  let remaining = prefix.length - match.start
  let offset = selection.anchor.offset
  while (remaining > offset) {
    remaining -= offset
    index--
    if (!textNodes[index]) {
      return null
    }
    offset = textNodes[index].getTextContentSize()
  }
  const range = selection.clone()
  range.anchor.set(textNodes[index].getKey(), offset - remaining, 'text')
  return {
    query: match.query,
    prefix,
    closed: match.closed,
    selection: range,
    signature: `${node.getKey()}:${selection.anchor.offset}:${prefix}`,
  }
}

export type EmojiAutocompletePluginProps = { messages?: EmojiMessages }

export default function EmojiAutocompletePlugin({ messages = defaultEmojiMessages }: EmojiAutocompletePluginProps) {
  const [editor] = useLexicalComposerContext()
  const portalRoot = useContext(Ariakit.PortalContext)
  const id = useId()
  const [menu, setMenu] = useState<{ match: Match; results: Emoji[]; left: number; top: number } | null>(null)
  const [active, setActive] = useState(0)
  const current = useRef(menu)
  current.current = menu
  const activeRef = useRef(active)
  activeRef.current = active
  const dismissed = useRef<string>()

  useEffect(() => {
    let disposed = false
    let generation = 0
    const refresh = (allowConversion: boolean, previousPrefix: string | undefined) => {
      const revision = ++generation
      const match = editor.getEditorState().read($getMatch)
      if (!editor.isEditable() || editor.isComposing() || !match || match.signature === dismissed.current) {
        setMenu(null)
        return
      }
      void loadEmojis()
        .then((result) => {
          if (result.isFailed()) {
            setMenu(null)
            return
          }
          const emojis = result.getValue()
          if (disposed || generation !== revision) {
            return
          }
          const latest = editor.getEditorState().read($getMatch)
          if (latest?.signature !== match.signature) {
            return
          }
          if (match.closed) {
            const exact = emojis.find((emoji) => emoji.names.includes(match.query))
            setMenu(null)
            if (exact && allowConversion && previousPrefix !== undefined && match.prefix === `${previousPrefix}:`) {
              insertEmoji(editor, exact.native, match.selection)
              rememberEmoji(exact.id)
            }
            return
          }
          const results = searchEmojis(emojis, match.query, readRecentEmojis()).slice(0, 8)
          if (!results.length) {
            setMenu(null)
            return
          }
          const domSelection = window.getSelection()
          const rect = domSelection?.rangeCount
            ? domSelection.getRangeAt(0).getBoundingClientRect()
            : editor.getRootElement()?.getBoundingClientRect()
          setActive(0)
          setMenu({
            match,
            results,
            left: Math.max(8, Math.min(rect?.left ?? 8, window.innerWidth - 280)),
            top: Math.min(rect?.bottom ?? 8, window.innerHeight - 360),
          })
        })
        .catch(() => {
          if (!disposed && generation === revision) {
            setMenu(null)
          }
        })
    }
    const unregister = editor.registerUpdateListener(({ tags, prevEditorState, dirtyLeaves }) => {
      const historic = tags.has('historic') || tags.has('collaboration')
      // Only an appended closing colon can convert, never formatting, paste, remote edits or undo.
      const previousPrefix = prevEditorState.read(() => $getEmojiContext()?.prefix)
      refresh(!historic && !tags.has(PASTE_TAG) && dirtyLeaves.size > 0, previousPrefix)
    })
    const close = () => {
      generation++
      dismissed.current = editor.getEditorState().read($getMatch)?.signature
      setMenu(null)
    }
    const keydown = (event: KeyboardEvent) => {
      const state = current.current
      if (!state || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) {
        return
      }
      if (!['ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Escape'].includes(event.key)) {
        return
      }
      event.preventDefault()
      event.stopImmediatePropagation()
      if (event.key === 'Escape') {
        close()
        return
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        setActive((value) => (value + (event.key === 'ArrowUp' ? -1 : 1) + state.results.length) % state.results.length)
      } else {
        const emoji = state.results[activeRef.current]
        close()
        insertEmoji(editor, emoji.native, state.match.selection)
        rememberEmoji(emoji.id)
      }
    }
    const pointerdown = (event: PointerEvent) => {
      if (event.target instanceof Element && !event.target.closest(`[data-emoji-menu="${id}"]`)) {
        close()
      }
    }
    const unregisterRoot = editor.registerRootListener((root, previous) => {
      previous?.removeEventListener('keydown', keydown, true)
      root?.addEventListener('keydown', keydown, true)
    })
    document.addEventListener('pointerdown', pointerdown)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      disposed = true
      unregister()
      editor.getRootElement()?.removeEventListener('keydown', keydown, true)
      unregisterRoot()
      document.removeEventListener('pointerdown', pointerdown)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [editor, id])

  useEffect(() => {
    const root = editor.getRootElement()
    if (!root || !menu) {
      return
    }
    const previous = root.getAttribute('aria-activedescendant')
    root.setAttribute('aria-activedescendant', `${id}-${active}`)
    root.setAttribute('aria-controls', id)
    return () => {
      if (previous) {
        root.setAttribute('aria-activedescendant', previous)
      } else {
        root.removeAttribute('aria-activedescendant')
      }
      root.removeAttribute('aria-controls')
    }
  }, [active, editor, id, menu])

  if (!menu) {
    return null
  }
  return (
    <>
      {createPortal(
        <div
          id={id}
          data-emoji-menu={id}
          role="listbox"
          aria-label={messages.suggestions}
          className="fixed z-50 max-h-80 w-64 overflow-auto rounded border border-[--border-weak] bg-[--background-norm] p-1 shadow-lg"
          style={{ left: menu.left, top: Math.max(8, menu.top) }}
        >
          {menu.results.map((emoji, index) => (
            <button
              type="button"
              tabIndex={-1}
              key={emoji.id}
              id={`${id}-${index}`}
              role="option"
              aria-label={emoji.name}
              aria-selected={active === index}
              className={clsx(
                'flex w-full cursor-pointer gap-2 rounded p-2 text-left',
                active === index && 'bg-[--interaction-weak-minor-2]',
              )}
              onMouseDown={(event) => {
                event.preventDefault()
                dismissed.current = menu.match.signature
                setMenu(null)
                insertEmoji(editor, emoji.native, menu.match.selection)
                rememberEmoji(emoji.id)
              }}
            >
              <span aria-hidden="true">{emoji.native}</span>
              <span>:{emoji.id}:</span>
            </button>
          ))}
        </div>,
        portalRoot ?? document.body,
      )}
    </>
  )
}
