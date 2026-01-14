import { c } from 'ttag'

import { Button } from '@proton/atoms/Button/Button'
import {
  type ModalProps,
  ModalTwo,
  ModalTwoContent,
  ModalTwoFooter,
  useActiveBreakpoint,
  useAuthentication,
  useLocalState,
  useModalTwoStatic,
} from '@proton/components'
import { APPS, SHEETS_APP_NAME } from '@proton/shared/lib/constants'

import { useIsSheetsEnabled } from '~/utils/misc'
import { getAppHref } from '@proton/shared/lib/apps/helper'

function SheetsAnnouncementModal(modalProps: ModalProps) {
  const { getLocalID } = useAuthentication()

  return (
    <ModalTwo {...modalProps} size="xlarge">
      <ModalTwoContent className="pt-4">
        <video
          className="aspect-[735992/409609] rounded-[2rem] bg-contain bg-center"
          style={{ backgroundImage: 'url(/announcement-video-initial-frame.webp)' }}
          src="/announcement-video.webm"
          autoPlay
          muted
          playsInline
        />
        <div className="px-8 pt-6">
          <h1 className="text-bold text-4xl">{c('Title').t`Introducing ${SHEETS_APP_NAME}`}</h1>
          <p className="color-weak text-lg">
            {c('Info')
              .t`Your data stays yours. Create and collaborate using fully featured spreadsheets secured with end-to-end encryption.`}
          </p>
        </div>
      </ModalTwoContent>
      <ModalTwoFooter className="flex justify-start gap-2 px-8 pb-4">
        <Button
          size="medium"
          color="success"
          onClick={() => {
            window.open(getAppHref('/sheet', APPS.PROTONDOCS, getLocalID()), '_blank')
            modalProps.onClose?.()
          }}
        >
          {c('Action').t`Create a spreadsheet`}
        </Button>
        <Button
          size="medium"
          shape="outline"
          onClick={modalProps.onClose}
          data-testid="sheets-announcement-modal-close-button"
        >
          {c('Onboarding Action').t`Maybe later`}
        </Button>
      </ModalTwoFooter>
    </ModalTwo>
  )
}

export const useSheetsAnnouncementModal = () => {
  const sheetsEnabled = useIsSheetsEnabled()
  const [sheetsAnnouncementModal, showSheetsAnnouncementModal] = useModalTwoStatic(SheetsAnnouncementModal)
  const [alreadyShown, setAlreadyShown] = useLocalState(false, 'modal_sheets_announcement_shown')

  const { viewportWidth } = useActiveBreakpoint()
  const isSmallViewport = viewportWidth['<=small']

  const shouldShow = sheetsEnabled && !alreadyShown && !isSmallViewport
  if (shouldShow && !alreadyShown) {
    showSheetsAnnouncementModal({})
    setAlreadyShown(true)
  }

  return [sheetsAnnouncementModal, showSheetsAnnouncementModal] as const
}
