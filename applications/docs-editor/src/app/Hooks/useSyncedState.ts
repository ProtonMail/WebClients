import { useApplication } from '../Containers/ApplicationProvider'
import { useEffect, useState } from 'react'

export function useSyncedState() {
  const { application } = useApplication()

  const [userName, setUserName] = useState(application.syncedState.getProperty('userName'))
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(
    application.syncedState.getProperty('suggestionsEnabled'),
  )
  const [receivedEverythingFromRTS, setReceivedEverythingFromRTS] = useState(
    application.syncedState.getProperty('receivedEverythingFromRTS'),
  )
  const [canOrganize, setCanOrganize] = useState(application.syncedState.getProperty('canOrganize'))

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

  useEffect(() => {
    return application.syncedState.subscribeToProperty('receivedEverythingFromRTS', (receivedEverythingFromRTS) => {
      setReceivedEverythingFromRTS(receivedEverythingFromRTS)
    })
  }, [application.syncedState])

  useEffect(() => {
    return application.syncedState.subscribeToProperty('canOrganize', (canOrganize) => {
      setCanOrganize(canOrganize)
    })
  }, [application.syncedState])

  return {
    userName,
    suggestionsEnabled,
    receivedEverythingFromRTS,
    canOrganize,
  }
}
