import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import type { ModalStateProps } from '@proton/components';

interface DeleteConversationModalProps extends ModalStateProps {
    onConfirm: () => void;
}

export const DeleteConversationModal = ({ onConfirm, ...modalProps }: DeleteConversationModalProps) => {
    const handleConfirm = () => {
        onConfirm();
        modalProps.onClose?.();
    };

    return (
        <ModalTwo {...modalProps} size="small">
            <ModalTwoHeader title={c('collider_2025:Title').t`Delete conversation?`} />
            <ModalTwoContent>
                <p>
                    {c('collider_2025:Info')
                        .t`Are you sure you want to delete this conversation? This action cannot be undone.`}
                </p>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={modalProps.onClose} color="weak">
                    {c('collider_2025:Button').t`Cancel`}
                </Button>
                <Button onClick={handleConfirm} color="danger">
                    {c('collider_2025:Button').t`Delete`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
