import { c } from 'ttag'

import { BasicModal, ModalStateProps, PrimaryButton, useModalTwoStatic } from '@proton/components'

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
  const handleCancel = () => {
    onClose()
  }

  return (
    <BasicModal
      title={title}
      isOpen={open === undefined ? true : open}
      onClose={handleCancel}
      footer={
        <>
          <PrimaryButton
            onClick={() => {
              onClose()
            }}
          >
            {c('Action').t`Ok`}
          </PrimaryButton>
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
