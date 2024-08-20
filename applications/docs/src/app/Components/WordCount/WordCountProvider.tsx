import type { WordCountInfoCollection } from '@proton/docs-shared'
import { createContext, useEffect, useState, type ReactNode } from 'react'
import { useApplication } from '../../Containers/ApplicationProvider'
import { WordCountEvent } from '@proton/docs-core/lib/Bridge/WordCountEvent'

type WordCountContextShape = {
  wordCountInfoCollection: WordCountInfoCollection
  floatingUIIsEnabled: boolean
  setFloatingUIIsEnabled: (isEnabled: boolean) => void
}

const INITIAL_WORD_COUNT_FLOATING_UI_ENABLED = false

export const WordCountContext = createContext<WordCountContextShape>({
  wordCountInfoCollection: {
    document: undefined,
    selection: undefined,
  },
  floatingUIIsEnabled: INITIAL_WORD_COUNT_FLOATING_UI_ENABLED,
  setFloatingUIIsEnabled: () => {},
})

export const WordCountContextProvider = ({ children }: { children: ReactNode }) => {
  const application = useApplication()
  const [wordCountInfoCollection, setWordCountInfoCollection] = useState<WordCountInfoCollection>({
    document: undefined,
    selection: undefined,
  })
  const [floatingUIIsEnabled, setFloatingUIIsEnabled] = useState<boolean>(INITIAL_WORD_COUNT_FLOATING_UI_ENABLED)

  useEffect(
    () =>
      application.eventBus.addEventCallback((newWordCountInfoCollection: WordCountInfoCollection) => {
        setWordCountInfoCollection(newWordCountInfoCollection)
      }, WordCountEvent),
    [application],
  )
  return (
    <WordCountContext.Provider value={{ wordCountInfoCollection, floatingUIIsEnabled, setFloatingUIIsEnabled }}>
      {children}
    </WordCountContext.Provider>
  )
}
