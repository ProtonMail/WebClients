import { c } from 'ttag';
import { Alert, ConfirmModal, ResetButton } from 'react-components';
import React from 'react';

const EditRecurringConfirmation = (props) => {
    const message = c('Info')
        .t`Would you like to edit all recurring events? This event will become the starting event.`;
    return (
        <ConfirmModal
            confirm={c('Action').t`Yes`}
            title={c('Info').t`Edit recurring event`}
            close={<ResetButton autoFocus={true}>{c('Action').t`No`}</ResetButton>}
            {...props}
        >
            <Alert>{message}</Alert>
        </ConfirmModal>
    );
};

export default EditRecurringConfirmation;
