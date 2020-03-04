import { c } from 'ttag';
import { Alert, ConfirmModal, ErrorButton, ResetButton } from 'react-components';
import React from 'react';

const DeleteConfirmModal = ({
    title = c('Info').t`Delete event`,
    message = c('Info').t`Would you like to delete this event?`,
    ...rest
}) => {
    return (
        <ConfirmModal
            confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
            title={title}
            close={<ResetButton autoFocus={true}>{c('Action').t`Cancel`}</ResetButton>}
            {...rest}
        >
            <Alert type="error">{message}</Alert>
        </ConfirmModal>
    );
};

export default DeleteConfirmModal;
