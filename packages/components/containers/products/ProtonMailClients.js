import React from 'react';
import { c } from 'ttag';
import { Text, Alert, Table, TableHeader, TableBody, TableRow, Href } from 'react-components';

const ProtonMailClients = () => {
    const clients = [
        {
            name: 'ProtonMail',
            plateform: 'Android',
            link: 'https://play.google.com/store/apps/details?id=ch.protonmail.android'
        },
        {
            name: 'ProtonMail',
            plateform: 'iOS',
            link: 'https://itunes.apple.com/app/protonmail-encrypted-email/id979659905'
        },
        { name: 'ProtonMail Bridge', plateform: 'Windows', link: 'https://protonmail.com/bridge/install' },
        { name: 'ProtonMail Bridge', plateform: 'MacOS', link: 'https://protonmail.com/bridge/install' },
        { name: 'ProtonMail Bridge', plateform: 'Linux', link: 'https://protonmail.com/bridge/install' }
    ];
    return (
        <>
            <Text className="bold">ProtonMail</Text>
            <Alert learnMore="todo">{c('Info').t`Lorem ipsum`}</Alert>
            <Table>
                <TableHeader
                    cells={[
                        c('Title for downloads section').t`Name`,
                        c('Title for downloads section').t`Platform`,
                        c('Title for downloads section').t`Action`
                    ]}
                />
                <TableBody>
                    {clients.map(({ name, plateform, link }, index) => {
                        const key = index.toString();
                        return (
                            <TableRow
                                key={key}
                                cells={[name, plateform, <Href key={key} url={link}>{c('Action').t`Download`}</Href>]}
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
};

export default ProtonMailClients;
