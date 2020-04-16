import { Alert, ConfirmModal, ResetButton } from 'react-components';
import { c } from 'ttag';
import React from 'react';

const CloseConfirmationModal = (props: any) => {
    return (
        <ConfirmModal
            title={c('Info').t`Discard changes?`}
            close={<ResetButton autoFocus={true}>{c('Action').t`Cancel`}</ResetButton>}
            confirm={c('Action').t`Discard`}
            {...props}
        >
            <Alert type="warning">{c('Info').t`You will lose all unsaved changes.`}</Alert>
        </ConfirmModal>
    );
};

export default CloseConfirmationModal;
