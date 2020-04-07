import React from 'react';
import { c } from 'ttag';

import { DialogModal, HeaderModal, InnerModal, FooterModal, ResetButton, ErrorButton } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

interface Props {
    title: string;
    children: any;
    onConfirm: () => void;
    onClose?: () => void;
    confirm?: string;
    close?: string;
}

const ConfirmDeleteModal = ({
    title,
    children,
    onConfirm,
    onClose = noop,
    confirm = c('Action').t`Confirm`,
    close = c('Action').t`Cancel`,
    ...rest
}: Props) => {
    const modalTitleID = 'confirm-delete-modal';

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            <HeaderModal modalTitleID={modalTitleID} onClose={onClose}>
                {title}
            </HeaderModal>
            <div className="pm-modalContent">
                <InnerModal>{children}</InnerModal>
                <FooterModal>
                    <ResetButton onClick={onClose} autoFocus>
                        {close}
                    </ResetButton>
                    <ErrorButton
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirm}
                    </ErrorButton>
                </FooterModal>
            </div>
        </DialogModal>
    );
};

export default ConfirmDeleteModal;
