import { c } from 'ttag'

import type { ModalStateProps } from '@proton/components'
import { ModalTwo, ModalTwoContent, ModalTwoFooter, PrimaryButton, useModalTwoStatic } from '@proton/components'
import { useState } from 'react'
import { DOCS_APP_NAME, DOCS_SHORT_APP_NAME, DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import { usePublicDocumentCopying } from '../Hooks/usePublicDocumentCopying'
import { useApplication } from '../../../Containers/ApplicationProvider'
import { useDocsContext } from '../../../Containers/ContextProvider'
import { Button } from '@proton/atoms/index'
import EncryptedBanner from '@proton/styles/assets/img/docs/encrypted-bg.png'

type Props = {}

/**
 * A modal displayed to users when they try to interact with a public document, such as clicking the toolbar
 */
export default function WelcomeSplashModal({ onClose, open, ...modalProps }: Props & ModalStateProps) {
  const application = useApplication()
  const { surePublicContext } = useDocsContext()
  const { createCopy } = usePublicDocumentCopying({ context: surePublicContext, controller: application.docController })

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
      {...modalProps}
    >
      <ModalTwoContent className="m-0 p-0">
        <div className="relative p-0">
          <img
            src={EncryptedBanner}
            alt="Encrypted"
            className="no-select pointer-events-none left-0 top-0 w-full select-none"
          />
          <div className="color-invert pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 select-none text-2xl tracking-wide">
            <h1 className="font-extralight">{c('Info').t`${DOCS_SHORT_APP_NAME} in`}</h1>
            <h1 className="font-medium">{DRIVE_APP_NAME}</h1>
          </div>
        </div>
        <div className="p-6">
          <h1 className="text-base font-bold">{c('Info').t`Create a copy to edit`}</h1>
          <p className="mt-1">{c('Info')
            .t`${DOCS_APP_NAME} lets you collaborate in real-time with end-to-end encryption for complete privacy. Create a copy to start editing, or ask the owner for edit access.`}</p>
        </div>
      </ModalTwoContent>

      <ModalTwoFooter>
        <Button onClick={handleClose}>{c('Action').t`No, thanks`}</Button>
        <PrimaryButton onClick={createCopy}>{c('Action').t`Create a copy`}</PrimaryButton>
      </ModalTwoFooter>
    </ModalTwo>
  )
}

export const useWelcomeSplashModal = () => {
  return useModalTwoStatic(WelcomeSplashModal)
}
