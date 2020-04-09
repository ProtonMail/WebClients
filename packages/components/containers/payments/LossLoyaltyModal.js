import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Alert, ConfirmModal, ErrorButton, Paragraph } from 'react-components';
import { isLoyal, hasCovid } from 'proton-shared/lib/helpers/organization';
import { PLANS } from 'proton-shared/lib/constants';

const hasPlan = (subscription = {}, planName) => (subscription.Plans || []).some(({ Name }) => Name === planName);

const LossLoyaltyModal = ({ user = {}, organization = {}, subscription = {}, ...rest }) => {
    const loyal = isLoyal(organization);
    const covid = hasCovid(organization);
    return (
        <ConfirmModal
            title={c('Title').t`Confirm loss of Proton bonuses`}
            confirm={<ErrorButton type="submit">{c('Action').t`Remove bonuses`}</ErrorButton>}
            {...rest}
        >
            <Paragraph>{c('Info').t`As an early Proton user, your account has extra features.`}</Paragraph>
            <Alert type="warning">
                {c('Info')
                    .t`By downgrading to a Free plan, you will permanently lose these benefits, even if you upgrade again in the future.`}
                <ul>
                    {user.hasPaidMail && loyal ? <li>{c('Info').t`+5GB bonus storage`}</li> : null}
                    {user.hasPaidVpn && loyal ? (
                        <li>{c('Info').t`+2 connections for ProtonVPN (allows you to connect more devices to VPN)`}</li>
                    ) : null}
                    {covid && hasPlan(subscription, PLANS.PLUS) ? <li>{c('Info').t`+5 GB bonus storage`}</li> : null}
                    {covid && hasPlan(subscription, PLANS.PROFESSIONAL) ? (
                        <li>{c('Info').t`+5 GB bonus storage per user`}</li>
                    ) : null}
                    {covid && hasPlan(subscription, PLANS.VISIONARY) ? (
                        <li>{c('Info').t`+10 GB bonus storage`}</li>
                    ) : null}
                </ul>
            </Alert>
        </ConfirmModal>
    );
};

LossLoyaltyModal.propTypes = {
    user: PropTypes.object.isRequired,
    organization: PropTypes.object.isRequired,
    subscription: PropTypes.object.isRequired
};

export default LossLoyaltyModal;
