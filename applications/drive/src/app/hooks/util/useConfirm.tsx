import React from 'react';
import { c } from 'ttag';

import { useModals, Alert, ConfirmModal, ErrorButton } from 'react-components';

const useConfirm = () => {
    const { createModal } = useModals();

    const openConfirmModal = (title: string, confirm: string, message: string, onConfirm: () => any) => {
        const content = (
            <>
                {message}
                <br />
                {c('Info').t`You cannot undo this action.`}
            </>
        );

        createModal(
            <ConfirmModal
                small={false}
                title={title}
                confirm={<ErrorButton type="submit">{confirm}</ErrorButton>}
                onConfirm={onConfirm}
            >
                <Alert type="error">{content}</Alert>
            </ConfirmModal>
        );
    };

    return { openConfirmModal };
};

export default useConfirm;
