import { Button } from '@proton/atoms/Button/Button'
import { c } from 'ttag'

import type { ModalStateProps } from '@proton/components'
import { BasicModal, useModalTwoStatic } from '@proton/components'
import type { ReactNode } from 'react'
import { useState } from 'react'

type Props = {
  title: string
  translatedMessage: string
  renderCustomFooter?: (handleClose: () => void) => ReactNode
}

export default function GenericAlertModal({
  title,
  translatedMessage,
  onClose,
  open,
  renderCustomFooter,
  ...modalProps
}: Props & ModalStateProps) {
  const [isOpen, setIsOpen] = useState(open)

  const handleClose = () => {
    setIsOpen(false)
    if (typeof onClose !== 'undefined') {
      onClose()
    }
  }

  return (
    <BasicModal
      title={title}
      isOpen={isOpen === undefined ? true : isOpen}
      onClose={handleClose}
      footer={
        renderCustomFooter ? (
          renderCustomFooter(handleClose)
        ) : (
          <Button color="norm" onClick={handleClose}>{c('Action').t`OK`}</Button>
        )
      }
      {...modalProps}
    >
      <p>{translatedMessage}</p>
    </BasicModal>
  )
}

export const useGenericAlertModal = () => {
  return useModalTwoStatic(GenericAlertModal)
}
