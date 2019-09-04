import React from 'react';
import { c } from 'ttag';
import { Alert, ConfirmModal } from 'react-components';

const DowngradeModal = (props) => {
    return (
        <ConfirmModal title={c('Title').t`Confirm downgrade`} confirm={c('Action').t`Downgrade`} {...props}>
            <Alert>{c('Info')
                .t`This will downgrade your account to the Free plan. The Free plan is supported by donations and paid accounts. Please consider making a donation so we can continue offering our service for free.`}</Alert>
            <Alert type="warning">{c('Info')
                .t`Additional addresses, custom domains, and users must be removed/disabled before performing this action.`}</Alert>
        </ConfirmModal>
    );
};

export default DowngradeModal;
