import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Alert, ConfirmModal, ErrorButton, Paragraph } from 'react-components';

const LossLoyaltyModal = ({ user = {}, ...rest }) => {
    return (
        <ConfirmModal
            title={c('Title').t`Confirm loss of Proton bonuses`}
            confirm={<ErrorButton type="submit">{c('Action').t`Remove bonuses`}</ErrorButton>}
            {...rest}
        >
            <Paragraph>{c('Info').t`As an early Proton user, your account has extra features..`}</Paragraph>
            <Alert type="warning">
                {c('Info')
                    .t`By downgrading to a Free plan, you will permanently lose these benefits, even if you upgrade again in the future.`}
                <ul>
                    {user.hasPaidMail ? <li>{c('Info').t`+5GB bonus storage`}</li> : null}
                    {user.hasPaidVpn ? (
                        <li>{c('Info').t`+2 connections for ProtonVPN (allows you to connect more devices to VPN)`}</li>
                    ) : null}
                </ul>
            </Alert>
        </ConfirmModal>
    );
};

LossLoyaltyModal.propTypes = {
    user: PropTypes.object.isRequired
};

export default LossLoyaltyModal;
