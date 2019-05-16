import React from 'react';
import { c } from 'ttag';
import { SubTitle, Alert, PrimaryButton, useUser, useNotifications } from 'react-components';

const ProtonMailBridgeSection = () => {
    const [{ hasPaidMail }] = useUser();
    const { createNotification } = useNotifications();
    const handleClick = () =>
        createNotification({
            type: 'info',
            text: c('Info').t`This feature is only available for paid users.`
        });
    return (
        <>
            <SubTitle>ProtonMail Bridge</SubTitle>
            <Alert learnMore="https://protonmail.com/bridge/">{c('Info')
                .t`ProtonMail Supports IMAP/SMTP via the ProtonMail Bridge application. Thunderbird, Microsoft Outlook, and Apple Mail are officially supported on both Windows and MacOS.`}</Alert>
            {hasPaidMail ? null : <PrimaryButton onClick={handleClick}>{c('Action').t`Activate`}</PrimaryButton>}
        </>
    );
};

export default ProtonMailBridgeSection;
