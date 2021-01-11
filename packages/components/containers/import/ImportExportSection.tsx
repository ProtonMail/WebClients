import { APPS } from 'proton-shared/lib/constants';
import React from 'react';
import { c } from 'ttag';

import { Alert, AppLink, Href, Icon, Table, TableBody, TableHeader, TableRow } from '../../components';
import { useUser } from '../../hooks';

const ImportExportSection = () => {
    const [{ hasPaidMail }] = useUser();

    const clients = [
        {
            icon: 'apple',
            platform: 'macOS',
            fileType: '.dmg',
            link: 'https://protonmail.com/import-export',
        },
        {
            icon: 'windows',
            platform: 'Windows',
            fileType: '.exe',
            link: 'https://protonmail.com/import-export',
        },
        {
            icon: 'linux',
            platform: 'GNU/Linux',
            fileType: '.deb',
            link: 'https://protonmail.com/import-export',
        },
        {
            icon: 'linux',
            platform: 'GNU/Linux',
            fileType: '.rpm',
            link: 'https://protonmail.com/import-export',
        },
        {
            icon: 'linux',
            platform: 'GNU/Linux',
            fileType: 'PKGBUILD',
            link: 'https://protonmail.com/import-export',
        },
    ];

    if (!hasPaidMail) {
        const upgradeLink = (
            <AppLink key="upgradeLink" to="/subscription" toApp={APPS.PROTONACCOUNT}>
                {c('Action').t`upgrade`}
            </AppLink>
        );
        return (
            <Alert>
                {c('Info')
                    .jt`Import and export your messages for local backups with Proton's dedicated desktop app. To use Import-Export, ${upgradeLink} to a paid account.`}
            </Alert>
        );
    }

    return (
        <>
            <Alert>
                {c('Info').t`Import and export your messages for local backups with Proton's dedicated desktop app.`}
            </Alert>

            <Table className="pm-simple-table--has-actions">
                <TableHeader
                    cells={[
                        c('Title for downloads section').t`Platform`,
                        c('Title for downloads section').t`File type`,
                        c('Title for downloads section').t`Action`,
                    ]}
                />
                <TableBody>
                    {clients.map(({ fileType, icon, platform, link }, index) => {
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
        </>
    );
};

export default ImportExportSection;
