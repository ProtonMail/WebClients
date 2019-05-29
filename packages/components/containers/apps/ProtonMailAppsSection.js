import React from 'react';
import { c } from 'ttag';
import { Table, TableHeader, TableBody, TableRow, Href, SubTitle } from 'react-components';

const ProtonMailAppsSection = () => {
    const clients = [
        {
            name: 'ProtonMail - Encrypted Email',
            plateform: 'Android',
            link: 'https://play.google.com/store/apps/details?id=ch.protonmail.android'
        },
        {
            name: 'ProtonMail - Encrypted Email',
            plateform: 'iOS',
            link: 'https://itunes.apple.com/app/protonmail-encrypted-email/id979659905'
        },
        { name: 'ProtonMail Bridge', plateform: 'Windows', link: 'https://protonmail.com/bridge/install' },
        { name: 'ProtonMail Bridge', plateform: 'MacOS', link: 'https://protonmail.com/bridge/install' },
        { name: 'ProtonMail Bridge', plateform: 'Linux', link: 'https://protonmail.com/bridge/install' }
    ];

    return (
        <>
            <SubTitle>ProtonMail apps</SubTitle>
            <Table>
                <TableHeader
                    cells={[
                        c('Title for downloads section').t`Platform`,
                        c('Title for downloads section').t`Name`,
                        c('Title for downloads section').t`Action`
                    ]}
                />
                <TableBody>
                    {clients.map(({ name, plateform, link }, index) => {
                        const key = index.toString();
                        return (
                            <TableRow
                                key={key}
                                cells={[plateform, name, <Href key={key} url={link}>{c('Action').t`Download`}</Href>]}
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
};

export default ProtonMailAppsSection;
