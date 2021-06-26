import React from 'react';
import { EmailSubscriptionCheckboxes } from '@proton/components';
import { c } from 'ttag';
import protonLogoSvg from '@proton/styles/assets/img/shared/proton-logo.svg';

import EmailUnsubscribeBorderedContainer from './EmailUnsubscribeBorderedContainer';
import './EmailUnsubscribeLayout.scss';

interface EmailSubscriptionManagementProps {
    News: number;
    disabled: boolean;
    onChange: (News: number) => void;
}

const EmailSubscriptionManagement = ({ News, disabled, onChange }: EmailSubscriptionManagementProps) => {
    return (
        <EmailUnsubscribeBorderedContainer className="mrauto mlauto">
            <img
                src={protonLogoSvg}
                alt={c('Title').t`Proton Logo`}
                className="email-unsubscribe-layout--logo block mlauto mrauto mb2"
            />

            {c('Email Unsubscribe').jt`Which emails do you want to receive from Proton?`}

            <div className="mt2">
                <EmailSubscriptionCheckboxes News={News} disabled={disabled} onChange={onChange} />
            </div>
        </EmailUnsubscribeBorderedContainer>
    );
};

export default EmailSubscriptionManagement;
