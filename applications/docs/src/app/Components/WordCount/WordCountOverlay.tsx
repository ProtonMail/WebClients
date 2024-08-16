import { useFloatingWordCount } from './useFloatingWordCount'
import { useWordCount } from './useWordCount'

import { c } from 'ttag'
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownMenuButton,
  DropdownSizeUnit,
  usePopperAnchor,
} from '@proton/components/components'
import { useState } from 'react'
const WordCountOverlay = () => {
  const wordCountCollection = useWordCount()
  const { floatingUIIsEnabled } = useFloatingWordCount()
  const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>()
  const [activeCountInfo, setActiveCountInfo] = useState<'word' | 'character'>('word')

  if (!floatingUIIsEnabled || !wordCountCollection.document) {
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
          wordCountCollection.selection ? (
            <>
              <span>
                <span className="text-bold">{wordCountCollection.selection.wordCount}</span>
                <span>/{wordCountCollection.document?.wordCount}</span>
              </span>
              <span>{c('Action').t`words`}</span>
            </>
          ) : (
            <>
              <span className="text-bold">{wordCountCollection.document.wordCount} </span>
              <span>{c('Action').t`words`}</span>
            </>
          )
        ) : wordCountCollection.selection ? (
          <>
            <span>
              <span className="text-bold">{wordCountCollection.selection.characterCount}</span>
              <span>/{wordCountCollection.document?.characterCount}</span>
            </span>
            <span>{c('Action').t`characters`}</span>
          </>
        ) : (
          <>
            <span className="text-bold">{wordCountCollection.document.characterCount} </span>
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
        <DropdownMenu className="text-sm">
          <DropdownMenuButton
            className="flex items-center gap-1 text-left"
            onClick={() => setActiveCountInfo('word')}
            data-testid="dropdown-word-count-active"
          >
            {wordCountCollection.selection ? (
              <>
                <span className="text-bold">{wordCountCollection.selection.wordCount}</span>
                <span>{c('Action').t`words out of`}</span>
                <span>{wordCountCollection.document?.wordCount}</span>
              </>
            ) : (
              <>
                <span className="text-bold">{wordCountCollection.document.wordCount}</span>
                <span>{c('Action').t`words`}</span>
              </>
            )}
          </DropdownMenuButton>

          <DropdownMenuButton
            className="flex items-center gap-1 text-left"
            onClick={() => setActiveCountInfo('character')}
            data-testid="dropdown-character-count-active"
          >
            {wordCountCollection.selection ? (
              <>
                <span className="text-bold">{wordCountCollection.selection.characterCount}</span>
                <span>
                  {c('Action').t`characters out of`} {wordCountCollection.document.characterCount}
                </span>
              </>
            ) : (
              <>
                <span className="text-bold">{wordCountCollection.document.characterCount}</span>
                <span>{c('Action').t`characters`}</span>
              </>
            )}
          </DropdownMenuButton>
        </DropdownMenu>
      </Dropdown>
    </>
  )
}

export default WordCountOverlay
