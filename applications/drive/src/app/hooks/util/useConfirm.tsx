import { c } from 'ttag';

import { ModalSize, useModals } from '@proton/components';
import { ConfirmationModal } from '../../components/modals/ConfirmationModal';

const useConfirm = () => {
    const { createModal } = useModals();

    const openConfirmModal = ({
        cancel,
        confirm,
        message,
        onConfirm,
        onCancel,
        onClose = onCancel,
        title,
        canUndo = false,
        size,
    }: {
        title: string;
        cancel?: string;
        confirm: string;
        message: string;
        onConfirm: () => Promise<any>;
        onCancel?: () => any;
        onClose?: () => any;
        canUndo?: boolean;
        size?: ModalSize;
    }) => {
        const content = (
            <>
                {message}
                <br />
                {!canUndo && c('Info').t`You cannot undo this action.`}
            </>
        );

        createModal(
            <ConfirmationModal
                title={title}
                cancelText={cancel}
                submitText={confirm}
                size={size}
                onSubmit={onConfirm}
                onCancel={onCancel}
                onClose={onClose}
            >
                {content}
            </ConfirmationModal>
        );
    };

    return { openConfirmModal };
};

export default useConfirm;
