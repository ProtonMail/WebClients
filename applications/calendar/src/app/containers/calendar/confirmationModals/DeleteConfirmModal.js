import { c } from 'ttag';
import { Alert, ConfirmModal, ErrorButton, ResetButton } from 'react-components';
import React from 'react';

const DeleteConfirmModal = (props) => {
    const title = c('Info').t`Delete event`;
    const message = c('Info').t`Would you like to delete this event?`;

    return (
        <ConfirmModal
            confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
            title={title}
            close={<ResetButton autoFocus={true}>{c('Action').t`Cancel`}</ResetButton>}
            {...props}
        >
            <Alert type="error">{message}</Alert>
        </ConfirmModal>
    );
};

export default DeleteConfirmModal;
