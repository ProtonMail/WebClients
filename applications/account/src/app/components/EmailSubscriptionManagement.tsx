import React from 'react';
import { NewsCheckboxes } from 'react-components';
import { c } from 'ttag';
import protonLogoSvg from 'design-system/assets/img/shared/proton-logo.svg';

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
                className="email-unsubscribe-layout--logo bl mlauto mrauto mb2"
            />

            {c('Email Unsubscribe').jt`Which emails do you want to receive from Proton?`}

            <div className="mt2">
                <NewsCheckboxes News={News} disabled={disabled} onChange={onChange} />
            </div>
        </EmailUnsubscribeBorderedContainer>
    );
};

export default EmailSubscriptionManagement;
