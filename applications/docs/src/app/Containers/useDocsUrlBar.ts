import { useCallback, useState } from 'react'
import { useAuthentication } from '@proton/components'
import { useLocation } from 'react-router-dom'
import type { DocumentAction } from '@proton/drive-store'
import { useDriveCompat } from '@proton/drive-store'
import { APPS } from '@proton/shared/lib/constants'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { getAppHref } from '@proton/shared/lib/apps/helper'

export function useDocsUrlBar() {
  const driveCompat = useDriveCompat()
  const { getLocalID } = useAuthentication()

  const { search } = useLocation()
  const searchParams = new URLSearchParams(search)
  const [openAction, setOpenAction] = useState<DocumentAction | null>(null)

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

  useEffectOnce(() => {
    const mode = (searchParams.get('mode') ?? 'open') as DocumentAction['mode']
    const parentLinkId = searchParams.get('parentLinkId')
    const volumeId = searchParams.get('volumeId')
    const linkId = searchParams.get('linkId')

    const hasRequiredParametersToLoadOrCreateADocument = volumeId && mode && (linkId || parentLinkId)

    if (!hasRequiredParametersToLoadOrCreateADocument && !driveCompat.isDocsEnabled) {
      window.location.assign(getAppHref('/', APPS.PROTONDRIVE, getLocalID()))
      return
    }

    if (!volumeId || !mode) {
      return
    }

    if (mode === 'open' || mode === 'convert') {
      if (!linkId) {
        return
      }

      setOpenAction({
        mode,
        volumeId,
        linkId,
      })
    } else if (mode === 'create') {
      if (!parentLinkId) {
        return
      }

      setOpenAction({
        mode,
        volumeId,
        parentLinkId,
      })
    }

    if (mode === 'history') {
      if (!linkId) {
        return
      }
      setOpenAction({
        mode,
        volumeId,
        linkId,
      })
    }

    if (mode === 'download') {
      if (!linkId) {
        return
      }
      setOpenAction({
        mode,
        volumeId,
        linkId,
      })
    }
  })

  return {
    openAction,
    updateParameters,
  }
}
