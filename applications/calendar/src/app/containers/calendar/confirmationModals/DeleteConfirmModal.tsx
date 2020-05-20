import React from 'react';
import { c } from 'ttag';
import { Alert, ConfirmModal, ErrorButton, ResetButton } from 'react-components';

const DeleteConfirmModal = (props: any) => {
    return (
        <ConfirmModal
            confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
            title={c('Info').t`Delete event`}
            close={<ResetButton autoFocus>{c('Action').t`Cancel`}</ResetButton>}
            {...props}
        >
            <Alert type="error">{c('Info').t`Would you like to delete this event?`}</Alert>
        </ConfirmModal>
    );
};

export default DeleteConfirmModal;
