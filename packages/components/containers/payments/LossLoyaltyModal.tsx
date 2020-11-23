import React from 'react';
import { c } from 'ttag';
import { Organization } from 'proton-shared/lib/interfaces';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import { Alert, ConfirmModal, ErrorButton, Paragraph } from '../../components';

interface Props {
    organization: Organization;
}

const LossLoyaltyModal = ({ organization, ...rest }: Props) => {
    const bonusSpace = organization.BonusSpace && humanSize(organization.BonusSpace, 'GB');
    return (
        <ConfirmModal
            title={c('Title').t`Confirm loss of Proton bonuses`}
            confirm={<ErrorButton type="submit">{c('Action').t`Remove bonuses`}</ErrorButton>}
            {...rest}
        >
            <Paragraph>{c('Info')
                .t`Since you're an early access user, your account has additional features enabled.`}</Paragraph>
            <Alert type="warning">
                {c('Info')
                    .t`By downgrading to a Free plan, you will permanently lose these benefits, even if you upgrade again in the future.`}
                <ul>
                    {organization.BonusSpace ? <li>{c('Info').t`+${bonusSpace} bonus storage`}</li> : null}
                    {organization.BonusVPN ? (
                        <li>{c('Info')
                            .t`+${organization.BonusVPN} connections for ProtonVPN (allows you to connect more devices to VPN)`}</li>
                    ) : null}
                </ul>
            </Alert>
        </ConfirmModal>
    );
};

export default LossLoyaltyModal;
