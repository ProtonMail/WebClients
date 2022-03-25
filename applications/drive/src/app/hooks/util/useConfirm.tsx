import { c } from 'ttag';

import { ModalSize, useModals } from '@proton/components';
import { ConfirmationModal } from '../../components/modals/ConfirmationModal';

const useConfirm = () => {
    const { createModal } = useModals();

    const openConfirmModal = ({
        confirm,
        message,
        onCancel,
        onConfirm,
        title,
        canUndo = false,
        size,
    }: {
        title: string;
        confirm: string;
        message: string;
        onConfirm: () => Promise<any>;
        onCancel?: () => any;
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
            <ConfirmationModal title={title} submitText={confirm} size={size} onSubmit={onConfirm} onClose={onCancel}>
                {content}
            </ConfirmationModal>
        );
    };

    return { openConfirmModal };
};

export default useConfirm;
