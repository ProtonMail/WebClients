import useAuthentication from '@proton/components/hooks/useAuthentication'
import type { ExtendedInvitationDetails } from '../invitationTypes'
import { isProtonDocsSpreadsheet } from '../utils/mimetype'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '../utils/apps'

export function useOpenInvitedDocument() {
  const { getLocalID } = useAuthentication()

  return function openInvitedDocument(invitation: ExtendedInvitationDetails) {
    const window = openBlankTab()
    const type = isProtonDocsSpreadsheet(invitation.link.mimeType) ? 'sheet' : 'doc'
    const volumeId = invitation.share.volumeId
    const linkId = invitation.link.linkId

    const href = getAppHref(`/${type}`, APPS.PROTONDOCS, getLocalID())
    const url = new URL(href)
    url.searchParams.append('mode', 'open')
    url.searchParams.append('volumeId', volumeId)
    url.searchParams.append('linkId', linkId)

    window.location.assign(url)
  }
}

// Copy of getNewWindow from packages/shared/lib/helpers/window.ts, called without a URL
function openBlankTab(): Window {
  const newTab = window.open('', '_blank')
  if (!newTab) {
    console.warn('Failed to open new window, using current tab')
    return window
  }
  return newTab
}
