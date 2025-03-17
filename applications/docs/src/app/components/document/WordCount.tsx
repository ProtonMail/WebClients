import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownMenuButton,
  DropdownSizeUnit,
  usePopperAnchor,
} from '@proton/components'
import type { WordCountInfoCollection } from '@proton/docs-shared'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { c } from 'ttag'
import { WordCountEvent } from '@proton/docs-core'
import { useApplication } from '~/utils/application-context'

const DEFAULT_ENABLED = false
export type WordCountContextValue = WordCountInfoCollection & {
  enabled: boolean
  setEnabled: Dispatch<SetStateAction<boolean>>
}
const WordCountContext = createContext<WordCountContextValue | undefined>(undefined)
export function WordCountProvider({ children }: { children: ReactNode }) {
  const application = useApplication()
  const [data, setData] = useState<WordCountInfoCollection>({
    document: undefined,
    selection: undefined,
  })
  const [enabled, setEnabled] = useState(DEFAULT_ENABLED)
  useEffect(
    () =>
      application.eventBus.addEventCallback(
        (newWordCountInfoCollection: WordCountInfoCollection) => setData(newWordCountInfoCollection),
        WordCountEvent,
      ),
    [application],
  )
  return <WordCountContext.Provider value={{ ...data, enabled, setEnabled }}>{children}</WordCountContext.Provider>
}
export function useWordCount() {
  const wordCountContext = useContext(WordCountContext)
  if (!wordCountContext) {
    throw new Error('Missing WordCount context')
  }
  return wordCountContext
}

export function WordCountOverlay() {
  const { selection, document, enabled } = useWordCount()
  const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>()
  const [activeCountInfo, setActiveCountInfo] = useState<'word' | 'character'>('word')

  if (!enabled || !document) {
    return null
  }

  return (
    <>
      <DropdownButton
        hasCaret
        ref={anchorRef}
        onClick={toggle}
        isOpen={isOpen}
        shape="outline"
        className="fixed bottom-2 left-2 z-30 flex gap-1 rounded-lg border border-[--border-weak] bg-[--background-norm] px-2 py-1"
      >
        {activeCountInfo === 'word' ? (
          selection ? (
            <>
              <span>
                <span className="text-bold">{selection.wordCount}</span>
                <span>/{document?.wordCount}</span>
              </span>
              <span>{c('Action').t`words`}</span>
            </>
          ) : (
            <>
              <span className="text-bold">{document.wordCount} </span>
              <span>{c('Action').t`words`}</span>
            </>
          )
        ) : selection ? (
          <>
            <span>
              <span className="text-bold">{selection.characterCount}</span>
              <span>/{document?.characterCount}</span>
            </span>
            <span>{c('Action').t`characters`}</span>
          </>
        ) : (
          <>
            <span className="text-bold">{document.characterCount} </span>
            <span>{c('Action').t`characters`}</span>
          </>
        )}
      </DropdownButton>

      <Dropdown
        isOpen={isOpen}
        onClose={close}
        anchorRef={anchorRef}
        size={{
          width: DropdownSizeUnit.Static,
        }}
        originalPlacement="top"
        className="py-0"
        contentProps={{
          className: 'after:h-0',
        }}
      >
        <DropdownMenu>
          <DropdownMenuButton
            className="flex items-center gap-1 text-left"
            onClick={() => setActiveCountInfo('word')}
            data-testid="dropdown-word-count-active"
          >
            {selection ? (
              <>
                <span className="text-bold">{selection.wordCount}</span>
                <span>{c('Action').t`words out of`}</span>
                <span>{document?.wordCount}</span>
              </>
            ) : (
              <>
                <span className="text-bold">{document.wordCount}</span>
                <span>{c('Action').t`words`}</span>
              </>
            )}
          </DropdownMenuButton>

          <DropdownMenuButton
            className="flex items-center gap-1 text-left"
            onClick={() => setActiveCountInfo('character')}
            data-testid="dropdown-character-count-active"
          >
            {selection ? (
              <>
                <span className="text-bold">{selection.characterCount}</span>
                <span>
                  {c('Action').t`characters out of`} {document.characterCount}
                </span>
              </>
            ) : (
              <>
                <span className="text-bold">{document.characterCount}</span>
                <span>{c('Action').t`characters`}</span>
              </>
            )}
          </DropdownMenuButton>
        </DropdownMenu>
      </Dropdown>
    </>
  )
}
