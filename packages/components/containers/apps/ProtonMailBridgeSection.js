import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Alert } from 'react-components';
import { getAccountSettingsApp } from 'proton-shared/lib/apps/helper';
import AppLink from '../../components/link/AppLink';

const ProtonMailBridgeSection = ({ permission }) => {
    return (
        <>
            <Alert learnMore="https://protonmail.com/bridge/">{c('Info')
                .t`ProtonMail supports IMAP/SMTP via the ProtonMail Bridge application. Thunderbird, Microsoft Outlook, and Apple Mail are officially supported on both Windows and MacOS.`}</Alert>
            {permission ? null : (
                <AppLink to="/subscription" toApp={getAccountSettingsApp()} className="pm-button pm-button--primary">{c(
                    'Action'
                ).t`Upgrade`}</AppLink>
            )}
        </>
    );
};

ProtonMailBridgeSection.propTypes = {
    permission: PropTypes.bool,
};

export default ProtonMailBridgeSection;
