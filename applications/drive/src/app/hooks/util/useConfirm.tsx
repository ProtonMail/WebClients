import React from 'react';
import { c } from 'ttag';

import { useModals, Alert, ConfirmModal, ErrorButton } from 'react-components';

const useConfirm = () => {
    const { createModal } = useModals();

    const openConfirmModal = ({
        confirm,
        message,
        onCancel,
        onConfirm,
        title,
        canUndo = false,
    }: {
        title: string;
        confirm: string;
        message: string;
        onConfirm: () => any;
        onCancel?: () => any;
        canUndo?: boolean;
    }) => {
        const content = (
            <>
                {message}
                <br />
                {!canUndo && c('Info').t`You cannot undo this action.`}
            </>
        );

        createModal(
            <ConfirmModal
                small={false}
                title={title}
                confirm={<ErrorButton type="submit">{confirm}</ErrorButton>}
                onConfirm={onConfirm}
                onClose={onCancel}
            >
                <Alert type="error">{content}</Alert>
            </ConfirmModal>
        );
    };

    return { openConfirmModal };
};

export default useConfirm;
