import { Button } from '@proton/atoms'
import { c } from 'ttag'

import type { ModalStateProps } from '@proton/components'
import { BasicModal, useModalTwoStatic } from '@proton/components'
import { useState } from 'react'

type Props = {
  title: string
  translatedMessage: string
}

export default function GenericAlertModal({
  title,
  translatedMessage,
  onClose,
  open,
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
        <>
          <Button color="norm" onClick={handleClose}>{c('Action').t`OK`}</Button>
        </>
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
