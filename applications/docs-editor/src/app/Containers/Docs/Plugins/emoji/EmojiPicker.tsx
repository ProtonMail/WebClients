import { readRecentEmojis, rememberEmoji } from './recentEmojis'
/* eslint-disable jsx-a11y/prefer-tag-over-role -- Ariakit composite rows and cells provide a keyboard-navigable emoji grid. */
import { Composite, CompositeItem, CompositeRow, useCompositeStore } from '@ariakit/react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection, type RangeSelection } from 'lexical'
import { useEffect, useRef, useState } from 'react'
import { defaultEmojiMessages, type EmojiMessages } from './emojiMessages'
import { loadEmojis, searchEmojis, type Emoji } from './emojiData'
import { insertEmoji } from './insertEmoji'

export type EmojiPickerProps = { messages?: EmojiMessages }

export default function EmojiPicker({ messages = defaultEmojiMessages }: EmojiPickerProps) {
  const [editor] = useLexicalComposerContext()
  const [emojis, setEmojis] = useState<Emoji[]>([])
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState(readRecentEmojis)
  const [name, setName] = useState('')
  const [failed, setFailed] = useState(false)
  const selection = useRef<RangeSelection>()
  const search = useRef<HTMLInputElement>(null)
  const store = useCompositeStore({ focusLoop: true })
  useEffect(() => search.current?.focus(), [])
  useEffect(() => {
    let disposed = false
    const capture = () =>
      editor.getEditorState().read(() => {
        const current = $getSelection()
        if ($isRangeSelection(current)) {
          selection.current = current.clone()
        }
      })
    capture()
    const unregister = editor.registerUpdateListener(capture)
    void loadEmojis()
      .then((result) => {
        if (result.isFailed()) {
          if (!disposed) {
            setFailed(true)
          }
          return
        }
        const data = result.getValue()
        if (!disposed) {
          setEmojis(data)
        }
      })
      .catch(() => {
        if (!disposed) {
          setFailed(true)
        }
      })
    return () => {
      disposed = true
      unregister()
    }
  }, [editor])

  const select = (emoji: Emoji) => {
    insertEmoji(editor, emoji.native, selection.current, true)
    setRecent(rememberEmoji(emoji.id))
  }
  const results = searchEmojis(emojis, query, recent)
  const groups = query.trim()
    ? [{ id: 'search', label: messages.searchResults, emojis: results }]
    : [
        {
          id: 'recent',
          label: messages.recent,
          emojis: recent.flatMap((id) => emojis.filter((emoji) => emoji.id === id)),
        },
        ...Object.entries(messages.categories).map(([id, label]) => ({
          id,
          label,
          emojis: emojis.filter((emoji) => emoji.category === id),
        })),
      ]
  return (
    <div
      role="presentation"
      className="w-72 p-2"
      data-testid="emoji-picker-menu"
      onClick={(event) => event.stopPropagation()}
      // Pointer clicks leave focus in the search box, so typing keeps filtering after an insert.
      onMouseDown={(event) => {
        if (event.target !== search.current) {
          event.preventDefault()
        }
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') {
          event.stopPropagation()
        }
      }}
    >
      <input
        ref={search}
        type="search"
        aria-label={messages.search}
        placeholder={messages.search}
        className="mb-2 w-full rounded border border-[--border-weak] bg-[--background-norm] p-2 text-sm"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          store.setActiveId(null)
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            store.move(store.first())
          }
        }}
      />
      {failed && <p role="alert">{messages.loadFailed}</p>}
      {!failed && !emojis.length && <output>{messages.loading}</output>}
      {emojis.length > 0 && !results.length && <output>{messages.noResults}</output>}
      <Composite
        store={store}
        role="grid"
        aria-label={messages.grid}
        className="max-h-64 overflow-auto"
        onKeyDown={(event) => {
          if (event.key !== 'Escape') {
            event.stopPropagation()
          }
        }}
      >
        {groups
          .filter((group) => group.emojis.length)
          .map((group) => (
            <div key={group.id} role="rowgroup">
              <div role="row">
                <div role="columnheader" className="text-weak my-1 text-xs">
                  {group.label}
                </div>
              </div>
              {Array.from({ length: Math.ceil(group.emojis.length / 8) }, (_, row) => (
                <CompositeRow store={store} role="row" key={row} className="flex">
                  {group.emojis.slice(row * 8, row * 8 + 8).map((emoji) => (
                    <CompositeItem
                      store={store}
                      key={emoji.id}
                      role="gridcell"
                      render={<button type="button" aria-label={emoji.name} />}
                      aria-label={emoji.name}
                      title={emoji.name}
                      className="h-8 w-8 shrink-0 rounded text-xl hover:bg-[--interaction-weak-minor-2] focus:bg-[--interaction-weak-minor-2] focus:outline focus:outline-1"
                      onClick={() => select(emoji)}
                      onFocus={() => setName(emoji.name)}
                      onMouseEnter={() => setName(emoji.name)}
                    >
                      <span aria-hidden="true">{emoji.native}</span>
                    </CompositeItem>
                  ))}
                </CompositeRow>
              ))}
            </div>
          ))}
      </Composite>
      <div className="text-weak mt-2 min-h-5 truncate text-xs" aria-live="polite">
        {name}
      </div>
    </div>
  )
}
