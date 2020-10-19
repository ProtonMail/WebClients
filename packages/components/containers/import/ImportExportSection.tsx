import React from 'react';
import { c } from 'ttag';

import { Alert, Href, Icon, Table, TableBody, TableHeader, TableRow } from '../../components';

const ImportExportSection = () => {
    const clients = [
        {
            icon: 'apple',
            platform: 'MacOS',
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

    return (
        <>
            <Alert>
                {c('Info')
                    .t`Download the Import-Export app to securely import messages from a different email provider or to back up ProtonMail messages on your device.`}
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
