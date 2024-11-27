import { useApplication } from '../ApplicationProvider'
import { useEffect, useState } from 'react'

export function useSyncedState() {
  const { application } = useApplication()

  const [userName, setUserName] = useState(application.syncedState.getProperty('userName'))

  useEffect(() => {
    return application.syncedState.subscribeToProperty('userName', (userName) => {
      setUserName(userName)
    })
  }, [application.syncedState])

  return {
    userName,
  }
}
