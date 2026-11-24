import { useState } from 'react'
import { c } from 'ttag'

import { Button } from '@proton/atoms/Button/Button'
import ModalTwo from '@proton/components/components/modalTwo/Modal'
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent'
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter'
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState'
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo'
import { DOCS_APP_NAME, DOCS_SHORT_APP_NAME, DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import EncryptedBanner from '@proton/styles/assets/img/docs/encrypted-bg.png'

interface WelcomeSplashModalProps extends ModalStateProps {
  /** Creates a copy of the document; without it, Create a copy is disabled */
  onCreateCopy?: () => void
}

/**
 * A modal displayed to users when they try to interact with a public document, such as clicking the toolbar.
 * Adapted from `applications/docs/src/app/components/document/public/WelcomeSplashModal.tsx`, which makes the copy with
 * docs-core's editor controller and document state: the copy comes in as a prop.
 */
function WelcomeSplashModal({ onClose, open, onCreateCopy, ...modalProps }: WelcomeSplashModalProps) {
  const [isOpen, setIsOpen] = useState(open)

  const handleClose = () => {
    setIsOpen(false)
    if (typeof onClose !== 'undefined') {
      onClose()
    }
  }

  return (
    <ModalTwo
      className="!rounded-t-xl"
      fullscreen={false}
      size="small"
      open={isOpen === undefined ? true : isOpen}
      onClose={handleClose}
      data-testid="welcome-splash-modal"
      {...modalProps}
    >
      <ModalTwoContent className="m-0 p-0">
        <div className="relative p-0">
          <img
            src={EncryptedBanner}
            alt={c('Info').t`Encrypted`}
            className="no-select pointer-events-none left-0 top-0 w-full select-none"
          />
          <div className="color-invert pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 select-none text-xs tracking-wide">
            <h1 className="font-extralight">{c('Info').t`${DOCS_SHORT_APP_NAME} in`}</h1>
            <h1 className="mt-4 font-medium">{DRIVE_APP_NAME}</h1>
          </div>
        </div>
        <div className="p-6">
          <h1 className="text-rg font-bold">{c('Info').t`Create a copy to edit`}</h1>
          <p className="mt-1">{c('Info')
            .t`${DOCS_APP_NAME} lets you collaborate in real-time with end-to-end encryption for complete privacy. Create a copy to start editing, or ask the owner for edit access.`}</p>
        </div>
      </ModalTwoContent>

      <ModalTwoFooter>
        <Button onClick={handleClose}>{c('Action').t`No, thanks`}</Button>
        <Button color="norm" disabled={!onCreateCopy} onClick={onCreateCopy}>{c('Action').t`Create a copy`}</Button>
      </ModalTwoFooter>
    </ModalTwo>
  )
}

export function useWelcomeSplashModal() {
  return useModalTwoStatic(WelcomeSplashModal)
}
