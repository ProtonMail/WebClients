import { useApplication } from '../Containers/ApplicationProvider'
import { useEffect, useState } from 'react'

export function useSyncedState() {
  const { application } = useApplication()

  const [userName, setUserName] = useState(application.syncedState.getProperty('userName'))
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(
    application.syncedState.getProperty('suggestionsEnabled'),
  )

  useEffect(() => {
    return application.syncedState.subscribeToProperty('userName', (userName) => {
      setUserName(userName)
    })
  }, [application.syncedState])

  useEffect(() => {
    return application.syncedState.subscribeToProperty('suggestionsEnabled', (suggestionsEnabled) => {
      setSuggestionsEnabled(suggestionsEnabled)
    })
  }, [application.syncedState])

  return {
    userName,
    suggestionsEnabled,
  }
}
