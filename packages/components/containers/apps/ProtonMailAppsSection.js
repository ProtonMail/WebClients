import React from 'react';
import { c } from 'ttag';
import { Table, TableHeader, TableBody, TableRow, Href, Alert } from '../../components';

const ProtonMailAppsSection = () => {
    const clients = [
        {
            platform: 'Android',
            compatibility: c('OS compatibility').t`Android 5 or later`,
            link: 'https://play.google.com/store/apps/details?id=ch.protonmail.android',
        },
        {
            platform: 'iOS',
            compatibility: c('OS compatibility').t`iOS 10 or later`,
            link: 'https://itunes.apple.com/app/protonmail-encrypted-email/id979659905',
        },
    ];

    return (
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
                    {clients.map(({ compatibility, platform, link }, index) => {
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
        </>
    );
};

export default ProtonMailAppsSection;
