import React from 'react';
import { c } from 'ttag';
import { SubTitle, Alert } from 'react-components';

const ProtonMailBridgeSection = () => {
    return (
        <>
            <SubTitle>ProtonMail Bridge</SubTitle>
            <Alert learnMore="https://protonmail.com/bridge/">{c('Info')
                .t`ProtonMail Supports IMAP/SMTP via the ProtonMail Bridge application. Thunderbird, Microsoft Outlook, and Apple Mail are officially supported on both Windows and MacOS.`}</Alert>
        </>
    );
};

export default ProtonMailBridgeSection;
