import { c } from 'ttag'

import type { ModalStateProps } from '@proton/components'
import { ModalTwo, ModalTwoContent, ModalTwoFooter, PrimaryButton, useModalTwoStatic } from '@proton/components'
import { useState } from 'react'
import { isFirefox, isSafari } from '@proton/shared/lib/helpers/browser'

type Props = {}

export default function ExportToPDFModal({ onClose, open, ...modalProps }: Props & ModalStateProps) {
  const [isOpen, setIsOpen] = useState(open)

  const close = () => {
    setIsOpen(false)
    if (typeof onClose !== 'undefined') {
      onClose()
    }
  }

  const saveString = () => {
    if (isFirefox()) {
      return c('Info').t`When the dialog opens, change the "Destination" to "Save to PDF", then press Save.`
    } else if (isSafari()) {
      return c('Info').t`When the dialog opens, select "PDF" in the lower-left corner, then press Save.`
    } else {
      return c('Info').t`When the dialog opens, change the "Destination" to "Save as PDF", then press Save.`
    }
  }

  return (
    <ModalTwo
      className="!rounded-t-xl"
      data-testid="print-pdf-modal"
      fullscreen={false}
      size="small"
      open={isOpen === undefined ? true : isOpen}
      onClose={close}
      {...modalProps}
    >
      <ModalTwoContent className="m-0 p-0">
        <div className="p-6">
          <h1 className="text-center text-base font-bold">{c('Info').t`Save Document as PDF`}</h1>
          <div className="mt-4 space-y-4">
            <p>{c('Info').t`Your browser's Print dialog will now open, where you can export your document to PDF.`}</p>
            <p>{saveString()}</p>
          </div>
        </div>
      </ModalTwoContent>

      <ModalTwoFooter>
        <div className="flex w-full flex-col">
          <PrimaryButton onClick={close}>{c('Action').t`Got it`}</PrimaryButton>
        </div>
      </ModalTwoFooter>
    </ModalTwo>
  )
}

export const useExportToPDFModal = () => {
  return useModalTwoStatic(ExportToPDFModal)
}
