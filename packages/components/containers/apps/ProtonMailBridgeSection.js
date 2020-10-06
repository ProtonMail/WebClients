import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { getAccountSettingsApp } from 'proton-shared/lib/apps/helper';
import { Alert, AppLink, Href, Table, TableHeader, TableBody, TableRow } from '../../components';

const ProtonMailBridgeSection = ({ permission }) => {
    const bridgeClients = [
        {
            compatibility: '10.12 or later',
            platform: 'Mac OSX',
            link: 'https://protonmail.com/bridge/install',
        },
        {
            compatibility: '64-bit system',
            platform: 'Windows',
            link: 'https://protonmail.com/bridge/install',
        },
        {
            compatibility: 'Debian distribution',
            platform: 'Linux',
            link: 'https://protonmail.com/bridge/install',
        },
        {
            compatibility: 'Fedora distribtion',
            platform: 'Linux',
            link: 'https://protonmail.com/bridge/install',
        },
        { compatibility: 'Other distribution', platform: 'Linux', link: 'https://protonmail.com/bridge/install' },
    ];

    const bridgeLink = (
        <Href url="https://protonmail.com/bridge/" key="bridge-link">{c('Link').t`ProtonMail Bridge page`}</Href>
    );

    return (
        <>
            <Alert learnMore="https://protonmail.com/bridge/">{c('Info')
                .t`ProtonMail supports IMAP/SMTP via the ProtonMail Bridge application. Thunderbird, Microsoft Outlook, and Apple Mail are officially supported on both Windows and MacOS.`}</Alert>
            {permission ? (
                <>
                    <Table className="pm-simple-table--has-actions">
                        <TableHeader
                            cells={[
                                c('Title for downloads section').t`Platform`,
                                c('Title for downloads section').t`Compatibility`,
                                c('Title for downloads section').t`Action`,
                            ]}
                        />
                        <TableBody>
                            {bridgeClients.map(({ compatibility, platform, link }, index) => {
                                const key = index.toString();
                                return (
                                    <TableRow
                                        key={key}
                                        cells={[
                                            platform,
                                            compatibility,
                                            <Href key={key} url={link}>{c('Action').t`Download`}</Href>,
                                        ]}
                                    />
                                );
                            })}
                        </TableBody>
                    </Table>
                    <Alert>{c('Info')
                        .jt`To access more download options and instructions on how to install and use ProtonMail Bridge, please visit our ${bridgeLink}`}</Alert>
                </>
            ) : (
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
