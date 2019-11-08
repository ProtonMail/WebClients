import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Alert, ConfirmModal, ErrorButton, Paragraph } from 'react-components';

const LossLoyaltyModal = ({ user = {}, ...rest }) => {
    return (
        <ConfirmModal
            title={c('Title').t`Confirm loss of Proton loyalty benefits`}
            confirm={<ErrorButton type="submit">{c('Action').t`Confirm`}</ErrorButton>}
            {...rest}
        >
            <Paragraph>{c('Info').t`As a long-term paid user, you are entitled to Proton loyalty benefits.`}</Paragraph>
            <Alert type="warning">
                {c('Info').t`By downgrading to a Free plan, you will permanently lose your current benefits:`}
                {user.hasPaidMail ? <div>{c('Info').t`+5 GB storage for ProtonMail`}</div> : null}
                {user.hasPaidVpn ? <div>{c('Info').t`+2 devices connected at once for ProtonVPN`}</div> : null}
            </Alert>
        </ConfirmModal>
    );
};

LossLoyaltyModal.propTypes = {
    user: PropTypes.object.isRequired
};

export default LossLoyaltyModal;
