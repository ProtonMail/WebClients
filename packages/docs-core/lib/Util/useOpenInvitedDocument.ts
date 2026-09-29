import useAuthentication from '@proton/components/hooks/useAuthentication'
import type { ExtendedInvitationDetails } from '@proton/drive-store/store'
import { isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { getNewWindow } from '@proton/shared/lib/helpers/window'

export function useOpenInvitedDocument() {
  const { getLocalID } = useAuthentication()

  return function openInvitedDocument(invitation: ExtendedInvitationDetails) {
    const window = getNewWindow().handle
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
