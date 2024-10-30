import type { DocumentAction } from '@proton/drive-store/index'
import type { RedirectAction } from '@proton/drive-store/store/_documents'

export const parseOpenAction = (searchParams: URLSearchParams): DocumentAction | null => {
  const mode = (searchParams.get('mode') ?? 'open') as DocumentAction['mode']
  const action = searchParams.get('action') as RedirectAction | undefined
  const parentLinkId = searchParams.get('parentLinkId')
  const volumeId = searchParams.get('volumeId')
  const linkId = searchParams.get('linkId')
  const token = searchParams.get('token')

  if (mode === 'copy-public') {
    return {
      mode,
    }
  }

  const hasValidPublicLink = token && linkId
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
