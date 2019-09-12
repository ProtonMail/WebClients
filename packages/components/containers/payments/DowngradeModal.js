import React from 'react';
import { c } from 'ttag';
import { Alert, ConfirmModal } from 'react-components';

const DowngradeModal = (props) => {
    return (
        <ConfirmModal title={c('Title').t`Confirm downgrade`} confirm={c('Action').t`Downgrade`} {...props}>
            <Alert>{c('Info').t`Your account will be downgraded in a few minutes.`}</Alert>
            <Alert type="warning">{c('Info')
                .t`Additional addresses, custom domains, and users must be removed/disabled before performing this action. Any connections to premium servers will be terminated.`}</Alert>
        </ConfirmModal>
    );
};

export default DowngradeModal;
