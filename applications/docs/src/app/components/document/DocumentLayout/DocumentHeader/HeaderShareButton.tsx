import useAuthentication from '@proton/components/hooks/useAuthentication'
import { Button } from '@proton/atoms/Button/Button'
import type { AuthenticatedDocControllerInterface } from '@proton/docs-core'
import { CacheService } from '@proton/docs-core/lib/Services/CacheService'
import { getDrive, generateNodeUid } from '@proton/drive'
import type { useSharingModal } from '@proton/drive/public/sharingModal'
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus'
import { c } from 'ttag'
import { useApplication } from '~/utils/application-context'
import { getPrivateURL, getPublicURL, getToken } from '../../useChangeAddressWhenPubliclyShared'
import { SentryRealtimeInitiatives, traceError } from '@proton/shared/lib/helpers/sentry'

type ShowSharingModal = ReturnType<typeof useSharingModal>['showSharingModal']

export function HeaderShareButton({
  sharingModalDriveSdkEnabled,
  showSharingModal,
  volumeId,
  nodeId,
  authenticatedController,
}: {
  sharingModalDriveSdkEnabled: boolean
  showSharingModal: ShowSharingModal
  volumeId: string
  nodeId: string
  authenticatedController: AuthenticatedDocControllerInterface | undefined
}) {
  const { logger } = useApplication()
  const { getLocalID } = useAuthentication()

  return (
    <Button
      shape="ghost"
      className="flex flex-nowrap items-center gap-2 border !border-[transparent] head-max-849:!mr-2 head-max-849:!border head-max-849:!border-[--border-norm] head-max-849:!px-[0.5em]"
      data-testid="share-button"
      onClick={() =>
        sharingModalDriveSdkEnabled
          ? showSharingModal({
              drive: getDrive(),
              nodeUid: generateNodeUid(volumeId, nodeId),
              onShareSnapshot(result) {
                if (result.ok) {
                  const { urlAccess } = result.value
                  try {
                    const newAddress = urlAccess ? getPublicURL(urlAccess.url) : getPrivateURL(volumeId, nodeId)
                    if (urlAccess) {
                      const localID = getLocalID()
                      if (localID !== undefined) {
                        const token = getToken(new URL(urlAccess.url).pathname)
                        CacheService.setLocalIDForDocumentInCache({ token }, localID)
                      }
                    }
                    history.replaceState(null, '', newAddress)
                  } catch (error: any) {
                    logger.warn('Failed to change URL in address bar after changing public sharing', error)
                    traceError(error, {
                      tags: {
                        initiative: SentryRealtimeInitiatives.SDK_SWITCH,
                        feature: 'DocsSharingModalDriveSDK',
                      },
                    })
                  }
                }
              },
            })
          : authenticatedController?.openDocumentSharingModal()
      }
    >
      <IcUserPlus />
      <span className="leading-none head-max-849:!sr-only">{c('Action').t`Share`}</span>
    </Button>
  )
}
