import { useCallback, useState } from 'react'
import { useAuthentication } from '@proton/components'
import { useLocation } from 'react-router-dom'
import type { DocumentAction } from '@proton/drive-store'
import { APPS } from '@proton/shared/lib/constants'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { parseOpenAction } from './parseOpenAction'

export function useDocsUrlBar({ isDocsEnabled }: { isDocsEnabled?: boolean } = { isDocsEnabled: true }) {
  const { getLocalID } = useAuthentication()

  const { search } = useLocation()
  const searchParams = new URLSearchParams(search)
  const [openAction, setOpenAction] = useState<DocumentAction | null>(parseOpenAction(searchParams))

  const updateParameters = useCallback((newVolumeId: string, newLinkId: string) => {
    setOpenAction({
      mode: 'open',
      volumeId: newVolumeId,
      linkId: newLinkId,
    })

    const newUrl = new URL(location.href)
    newUrl.searchParams.set('mode', 'open')
    newUrl.searchParams.set('volumeId', newVolumeId)
    newUrl.searchParams.set('linkId', newLinkId)

    history.replaceState(null, '', newUrl.toString())
  }, [])

  const navigateToAction = useCallback((action: DocumentAction, context: 'private' | 'public' = 'private') => {
    const userPortion = location.pathname.match(/u\/\d+/)?.[0]
    if (context === 'private' && !userPortion) {
      throw new Error('Attempting to navigate to private action without user portion')
    }

    const newUrl = new URL(context === 'private' ? location.href : location.origin)

    newUrl.searchParams.set('mode', action.mode)

    if ('volumeId' in action) {
      newUrl.searchParams.set('volumeId', action.volumeId)
    }

    if ('linkId' in action) {
      newUrl.searchParams.set('linkId', action.linkId)
    }

    if ('action' in action && action.action) {
      newUrl.searchParams.set('action', action.action)
    }

    if ('token' in action) {
      newUrl.searchParams.set('token', action.token)
    }

    if ('urlPassword' in action) {
      newUrl.hash = action.urlPassword
    }

    window.location.assign(newUrl.toString())
  }, [])

  const removeActionFromUrl = useCallback(() => {
    const newUrl = new URL(location.href)
    newUrl.searchParams.delete('action')
    history.replaceState(null, '', newUrl.toString())
  }, [])

  useEffectOnce(() => {
    const action = parseOpenAction(searchParams)

    if (!action && isDocsEnabled === false) {
      window.location.assign(getAppHref('/', APPS.PROTONDRIVE, getLocalID()))
      return
    }
  })

  return {
    openAction,
    updateParameters,
    removeActionFromUrl,
    navigateToAction,
    linkId: openAction && 'linkId' in openAction ? openAction.linkId : undefined,
  }
}
