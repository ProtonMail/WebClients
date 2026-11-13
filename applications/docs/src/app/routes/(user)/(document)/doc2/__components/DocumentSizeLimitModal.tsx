import { useEffect, useState } from 'react'

import { Button } from '@proton/atoms/Button/Button'
import ModalTwo from '@proton/components/components/modalTwo/Modal'
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent'
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter'
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader'
import type { Session } from '@proton-docs/realtime-sdk'
import { c } from 'ttag'

export type DocumentSizeLimitModalProps = {
  session: Session | undefined
  /** Saves the document as docx, once the editor shows it */
  onDownloadCopy: (() => void) | undefined
}

/**
 * Adapted from `applications/docs/src/app/components/document/DocumentSizeLimitModal.tsx`, which imports docs-core:
 * explains the document size limit the first time the SDK refuses an edit for it, in place of a toast. It offers no
 * "remove older revisions", since the SDK has no `squashEverything` until Phase 3 (ADR-0011).
 */
export function DocumentSizeLimitModal({ session, onDownloadCopy }: DocumentSizeLimitModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!session) {
      return
    }
    // Once per session: a size-locked session refuses every edit still on its way, which must not reopen it
    let shown = false
    const removeListener = session.on('refusal', ({ reason }) => {
      if (reason === 'documentSizeLimitReached' && !shown) {
        shown = true
        setIsOpen(true)
      }
    })
    return removeListener
  }, [session])

  return (
    <ModalTwo className="!rounded-t-xl" open={isOpen} onClose={() => setIsOpen(false)}>
      <ModalTwoHeader title={c('Title').t`Document Size Limit Exceeded`} hasClose={false} />
      <ModalTwoContent>
        {onDownloadCopy
          ? c('Info')
              .t`This document has grown too large, and your latest changes couldn’t be saved. Download a copy to keep your work.`
          : c('Info')
              .t`This document has grown too large, and your latest changes couldn’t be saved. Copy any work you need to keep it.`}
      </ModalTwoContent>
      <ModalTwoFooter>
        {onDownloadCopy && (
          <Button color="norm" onClick={onDownloadCopy}>
            {c('Action').t`Download a copy (as docx)`}
          </Button>
        )}
        <Button onClick={() => setIsOpen(false)}>{c('Action').t`Okay`}</Button>
      </ModalTwoFooter>
    </ModalTwo>
  )
}
