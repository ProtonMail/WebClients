import { useCallback, useState } from 'react'
import { useAuthentication } from '@proton/components'
import { useLocation } from 'react-router-dom'
import type { DocumentAction } from '@proton/drive-store'
import { APPS } from '@proton/shared/lib/constants'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import type { RedirectAction } from '@proton/drive-store/store/_documents'
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper'

export function useDocsUrlBar({ isDocsEnabled = true }: { isDocsEnabled?: boolean } = {}) {
  const { getLocalID } = useAuthentication()

  const { search } = useLocation()
  const searchParams = new URLSearchParams(search)
  const [openAction, setOpenAction] = useState<DocumentAction | null>(parseOpenAction(searchParams))

  /**
   * Changes the URL of the page only visually, without causing any navigation or changing
   * state that is read by other components
   */
  const changeURLVisually = useCallback((action: DocumentAction) => {
    if (action.mode !== 'open' && action.mode !== 'open-url') {
      return
    }

    const newURL = new URL(location.href)
    newURL.search = ''
    newURL.hash = ''

    if (action.mode === 'open') {
      newURL.searchParams.set('mode', 'open')
      newURL.searchParams.set('volumeId', action.volumeId)
      newURL.searchParams.set('linkId', action.linkId)
    } else if (action.mode === 'open-url') {
      newURL.searchParams.set('mode', 'open-url')
      newURL.searchParams.set('token', action.token)
      if (action.linkId) {
        newURL.searchParams.set('linkId', action.linkId)
      }
      newURL.hash = action.urlPassword
    }

    history.replaceState(null, '', newURL)
  }, [])

  const updateParameters = useCallback((params: { newVolumeId: string; newLinkId: string; pathname?: 'doc' }) => {
    setOpenAction({
      mode: 'open',
      volumeId: params.newVolumeId,
      linkId: params.newLinkId,
    })

    const newUrl = new URL(location.href)
    if (params.pathname) {
      const currentPathName = newUrl.pathname
      newUrl.pathname = replaceLastPathSegment(currentPathName, params.pathname)
    }
    newUrl.searchParams.set('mode', 'open')
    newUrl.searchParams.set('volumeId', params.newVolumeId)
    newUrl.searchParams.set('linkId', params.newLinkId)

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

    if ('linkId' in action && action.linkId) {
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

  const removeLocalIDFromUrl = useCallback(() => {
    const newUrl = new URL(location.href)
    newUrl.pathname = stripLocalBasenameFromPathname(newUrl.pathname)
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
    changeURLVisually,
    removeLocalIDFromUrl,
  }
}

export function parseOpenAction(searchParams: URLSearchParams): DocumentAction | null {
  const mode = (searchParams.get('mode') ?? 'open') as DocumentAction['mode']
  const action = searchParams.get('action') as RedirectAction | undefined
  const parentLinkId = searchParams.get('parentLinkId')
  const volumeId = searchParams.get('volumeId')
  const linkId = searchParams.get('linkId') || undefined
  const token = searchParams.get('token')

  if (mode === 'copy-public') {
    return {
      mode,
    }
  }

  const hasValidPublicLink = token
  const hasLinkId = !!linkId
  const hasRequiredParametersToLoadOrCreateADocument = volumeId && mode && (linkId || parentLinkId)
  const hasValidRoute = hasValidPublicLink || hasRequiredParametersToLoadOrCreateADocument

  if (!hasValidRoute) {
    return null
  }

  if (mode === 'open-url-reauth' && hasValidPublicLink) {
    return {
      mode,
      token,
      linkId,
      action,
    }
  }

  if (mode === 'open-url-download' && hasValidPublicLink && hasLinkId) {
    return {
      mode,
      token,
      linkId,
      urlPassword: window.location.hash,
      action,
    }
  }

  if (hasValidPublicLink) {
    return {
      mode: 'open-url',
      token,
      linkId,
      urlPassword: window.location.hash,
      action,
    }
  }

  /** At this point we start needing a volumeId or mode */
  if (!volumeId || !mode) {
    return null
  }

  if (mode === 'create') {
    if (!parentLinkId) {
      return null
    }

    return {
      mode,
      volumeId,
      parentLinkId,
    }
  }

  /** At this point we need a linkId */
  if (!linkId) {
    return null
  }

  if (mode === 'open' || mode === 'convert') {
    return {
      mode,
      volumeId,
      linkId,
    }
  }

  if (mode === 'history') {
    return {
      mode,
      volumeId,
      linkId,
    }
  }

  if (mode === 'download') {
    return {
      mode,
      volumeId,
      linkId,
    }
  }

  return null
}

/**
 * Takes a pathname and replaces its last segment with a new one, preserving the user portion if it exists
 * Example: replaceLastPathSegment('/u/1/foo', 'bar') => '/u/1/bar'
 *          replaceLastPathSegment('/foo', 'bar')     => '/bar'
 */
export const replaceLastPathSegment = (pathname: string, newSegment: string): string => {
  const userPortion = pathname.match(/\/u\/\d+/)?.[0]
  return userPortion ? `${userPortion}/${newSegment}` : `/${newSegment}`
}
