import { type Dispatch, type SetStateAction, useState } from 'react'

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor'
import Dropdown from '@proton/components/components/dropdown/Dropdown'
import DropdownButton from '@proton/components/components/dropdown/DropdownButton'
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu'
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton'
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils'
import type { WordCountInfoCollection } from '@proton/docs-shared/WordCount/WordCountTypes'
import { c } from 'ttag'

/** The counts the editor last reported, and whether the floating counter shows. */
export type WordCount = WordCountInfoCollection & {
  isShown: boolean
  setIsShown: Dispatch<SetStateAction<boolean>>
}

/** The word count state, and the setter for the counts the editor reports. */
export function useWordCountState(): [WordCount, (counts: WordCountInfoCollection) => void] {
  const [counts, setCounts] = useState<WordCountInfoCollection>({})
  const [isShown, setIsShown] = useState(false)
  return [{ ...counts, isShown, setIsShown }, setCounts]
}

export type WordCountOverlayProps = { wordCount: WordCount }

// Copied from `applications/docs/src/app/components/document/WordCount.tsx`, which reads the counts from docs-core's
// event bus.
export function WordCountOverlay({ wordCount: { selection, document, isShown } }: WordCountOverlayProps) {
  const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>()
  const [activeCountInfo, setActiveCountInfo] = useState<'word' | 'character'>('word')

  if (!isShown || !document) {
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
        data-testid="word-count-overlay"
      >
        <OverlayLabel document={document} selection={selection} activeCountInfo={activeCountInfo} />
      </DropdownButton>

      <Dropdown
        isOpen={isOpen}
        onClose={close}
        anchorRef={anchorRef}
        size={{ width: DropdownSizeUnit.Static }}
        originalPlacement="top"
        className="py-0"
        contentProps={{ className: 'after:h-0' }}
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
                <span>{document.wordCount}</span>
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

type OverlayLabelProps = Required<Pick<WordCountInfoCollection, 'document'>> &
  Pick<WordCountInfoCollection, 'selection'> & { activeCountInfo: 'word' | 'character' }

function OverlayLabel({ document, selection, activeCountInfo }: OverlayLabelProps) {
  const count = activeCountInfo === 'word' ? 'wordCount' : 'characterCount'
  const unit = activeCountInfo === 'word' ? c('Action').t`words` : c('Action').t`characters`
  if (selection) {
    return (
      <>
        <span>
          <span className="text-bold">{selection[count]}</span>
          <span>/{document[count]}</span>
        </span>
        <span>{unit}</span>
      </>
    )
  }
  return (
    <>
      <span className="text-bold">{document[count]} </span>
      <span>{unit}</span>
    </>
  )
}
