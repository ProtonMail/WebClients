import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SubTitle, Alert } from 'react-components';
import { Link } from 'react-router-dom';

const ProtonMailBridgeSection = ({ permission }) => {
    return (
        <>
            <SubTitle>ProtonMail Bridge</SubTitle>
            <Alert learnMore="https://protonmail.com/bridge/">{c('Info')
                .t`ProtonMail supports IMAP/SMTP via the ProtonMail Bridge application. Thunderbird, Microsoft Outlook, and Apple Mail are officially supported on both Windows and MacOS.`}</Alert>
            {permission ? null : (
                <Link to="/settings/subscription" className="pm-button pm-button--primary">{c('Action')
                    .t`Upgrade`}</Link>
            )}
        </>
    );
};

ProtonMailBridgeSection.propTypes = {
    permission: PropTypes.bool
};

export default ProtonMailBridgeSection;
