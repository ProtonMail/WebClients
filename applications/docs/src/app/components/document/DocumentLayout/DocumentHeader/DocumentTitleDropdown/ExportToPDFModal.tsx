import { Button } from '@proton/atoms/Button/Button'
import ModalTwo from '@proton/components/components/modalTwo/Modal'
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent'
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter'
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState'
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo'
import { c } from 'ttag'

import { modalTwoBackdropRootClassName } from '@proton/shared/lib/busy/busy'
import { isFirefox, isSafari } from '@proton/shared/lib/helpers/browser'
import { useState } from 'react'

/** Longest wait for the backdrop, which stays shown while another modal is open. */
const BACKDROP_HIDE_TIMEOUT_MS = 1000

/** The backdrop is shared by every modal, and hides only once its own exit animation has ended. */
function waitForBackdropToHide(): Promise<void> {
  const backdrops = [...document.querySelectorAll(`.${modalTwoBackdropRootClassName}`)]
  const allHidden = () => backdrops.every((backdrop) => !backdrop.isConnected || backdrop.classList.contains('hidden'))

  return new Promise((resolve) => {
    if (allHidden()) {
      resolve()
      return
    }
    const done = () => {
      observer.disconnect()
      clearTimeout(timeout)
      resolve()
    }
    const observer = new MutationObserver(() => {
      if (allHidden()) {
        done()
      }
    })
    backdrops.forEach((backdrop) => observer.observe(backdrop, { attributes: true, attributeFilter: ['class'] }))
    const timeout = setTimeout(done, BACKDROP_HIDE_TIMEOUT_MS)
  })
}

export type ExportToPDFModalProps = ModalStateProps

export function ExportToPDFModal({ onClose, onExit, open, ...modalProps }: ExportToPDFModalProps) {
  const [isOpen, setIsOpen] = useState(open)

  const close = () => {
    setIsOpen(false)
  }

  /**
   * `onClose` prints. Chrome stops rendering this page while its print preview is open, and an exit
   * animation that ends meanwhile never fires `animationend`, which is what removes the modal and then
   * the backdrop: either would stay over the page. So print only once both have finished exiting.
   */
  const handleExit = () => {
    onExit?.()
    void waitForBackdropToHide().then(() => onClose?.())
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
      onExit={handleExit}
      {...modalProps}
    >
      <ModalTwoContent className="m-0 p-0">
        <div className="p-6">
          <h1 className="text-rg text-center font-bold">{c('Info').t`Save Document as PDF`}</h1>
          <div className="mt-4 space-y-4">
            <p>{c('Info').t`Your browser's Print dialog will now open, where you can export your document to PDF.`}</p>
            <p>{saveString()}</p>
          </div>
        </div>
      </ModalTwoContent>

      <ModalTwoFooter>
        <div className="flex w-full flex-col">
          <Button color="norm" onClick={close}>{c('Action').t`Got it`}</Button>
        </div>
      </ModalTwoFooter>
    </ModalTwo>
  )
}

export function useExportToPDFModal() {
  return useModalTwoStatic(ExportToPDFModal)
}
