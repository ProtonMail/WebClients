import React from 'react';
import { c } from 'ttag';
import { Alert, Href, Table, TableHeader, TableBody, TableRow, Icon } from '../../components';

const ProtonMailBridgeSection = () => {
    const bridgeClients = [
        {
            icon: 'apple',
            platform: 'MacOS',
            fileType: c('OS compatibility').t`.dmg (10.12 or later)`,
            link: 'https://protonmail.com/bridge/install',
        },
        {
            icon: 'windows',
            platform: 'Windows',
            fileType: c('OS compatibility').t`.exe (64-bit)`,
            link: 'https://protonmail.com/bridge/install',
        },
        {
            icon: 'linux',
            platform: 'GNU/Linux',
            fileType: c('OS compatibility').t`.deb (for Debian/Ubuntu)`,
            link: 'https://protonmail.com/bridge/install',
        },
        {
            icon: 'linux',
            platform: 'GNU/Linux',
            fileType: c('OS compatibility').t`.rpm (for Fedora/openSUSE)`,
            link: 'https://protonmail.com/bridge/install',
        },
        {
            icon: 'linux',
            platform: 'GNU/Linux',
            fileType: c('OS compatibility').t`PKGBUILD (for other distributions)`,
            link: 'https://protonmail.com/bridge/install',
        },
    ];

    const bridgeLink = (
        <Href url="https://protonmail.com/bridge/" key="bridge-link">{c('Link').t`ProtonMail Bridge page`}</Href>
    );

    return (
        <>
            <Alert learnMore="https://protonmail.com/bridge/">{c('Info')
                .t`ProtonMail supports IMAP/SMTP via the ProtonMail Bridge application. Thunderbird, Microsoft Outlook, and Apple Mail are officially supported on both Windows and MacOS.`}</Alert>
            <Table className="pm-simple-table--has-actions">
                <TableHeader
                    cells={[
                        c('Title for downloads section').t`Platform`,
                        c('Title for downloads section').t`File type`,
                        c('Title for downloads section').t`Action`,
                    ]}
                />
                <TableBody>
                    {bridgeClients.map(({ fileType, icon, platform, link }, index) => {
                        const key = index.toString();
                        return (
                            <TableRow
                                key={key}
                                cells={[
                                    <span key="platform" className="inline-flex flex-items-center">
                                        <Icon name={icon} className="mr0-5" />
                                        <span>{platform}</span>
                                    </span>,
                                    fileType,
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
    );
};

export default ProtonMailBridgeSection;
