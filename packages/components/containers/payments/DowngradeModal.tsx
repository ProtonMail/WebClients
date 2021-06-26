import React from 'react';
import { c } from 'ttag';
import { PLAN_SERVICES } from 'proton-shared/lib/constants';
import { hasBit } from 'proton-shared/lib/helpers/bitset';
import { UserModel } from 'proton-shared/lib/interfaces';
import { ConfirmModal, Alert } from '../../components';

interface Props {
    user: UserModel;
    onClose: () => void;
    onConfirm: () => void;
}

const { MAIL, VPN } = PLAN_SERVICES;

const DowngradeModal = ({ user, ...rest }: Props) => {
    const title = c('Title').t`Confirm downgrade`;
    const confirm = c('Action').t`Downgrade`;
    const hasMail = hasBit(user.Services, MAIL);
    const hasVpn = hasBit(user.Services, VPN);
    const hasBundle = hasMail && hasVpn;

    return (
        <ConfirmModal title={title} confirm={confirm} {...rest}>
            <Alert>{c('Info')
                .t`Once you click "Downgrade", it may take a few minutes to downgrade your account to a Free plan. `}</Alert>
            <Alert type="error">
                {hasBundle
                    ? c('Info')
                          .t`If you proceed with the downgrade, you will lose access to ProtonMail and ProtonVPN paid features.`
                    : hasMail
                    ? c('Info')
                          .t`If you proceed with the downgrade, you will lose access to ProtonMail paid features, including additional storage and filters.`
                    : c('Info').t`If you proceed with the downgrade, you will lose access to ProtonVPN paid features.`}
            </Alert>
            <Alert type="warning">
                {[
                    hasMail &&
                        c('Info')
                            .t`You must disable or remove any additional ProtonMail users, addresses, and custom domains before you can downgrade.`,
                    hasVpn && c('Info').t`Downgrading will terminate any connections to paid ProtonVPN servers.`,
                ]
                    .filter(Boolean)
                    .join(' ')}
            </Alert>
        </ConfirmModal>
    );
};

export default DowngradeModal;
