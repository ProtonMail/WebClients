import React from 'react';
import { c } from 'ttag';
import { SubTitle, Alert, useUser } from 'react-components';
import { Link } from 'react-router-dom';

const ProtonMailBridgeSection = () => {
    const [{ hasPaidMail }] = useUser();
    return (
        <>
            <SubTitle>ProtonMail Bridge</SubTitle>
            <Alert learnMore="https://protonmail.com/bridge/">{c('Info')
                .t`ProtonMail supports IMAP/SMTP via the ProtonMail Bridge application. Thunderbird, Microsoft Outlook, and Apple Mail are officially supported on both Windows and MacOS.`}</Alert>
            {hasPaidMail ? null : (
                <Link to="/settings/subscription" className="pm-button pm-button--primary">{c('Action')
                    .t`Upgrade`}</Link>
            )}
        </>
    );
};

export default ProtonMailBridgeSection;
