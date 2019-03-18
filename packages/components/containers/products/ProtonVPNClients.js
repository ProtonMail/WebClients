import React from 'react';
import { c } from 'ttag';
import { Text, Alert, Table, TableHeader, TableBody, TableRow, Href } from 'react-components';

const ProtonVPNClients = () => {
    const clients = [
        {
            name: 'ProtonVPN',
            plateform: 'Android',
            link: 'https://play.google.com/store/apps/details?id=com.protonvpn.android'
        },
        {
            name: 'ProtonVPN',
            plateform: 'iOS',
            link: 'https://itunes.apple.com/us/app/protonvpn-fast-secure-vpn/id1437005085'
        },
        { name: 'ProtonVPN', plateform: 'Windows', link: 'https://protonvpn.com/download/' },
        { name: 'ProtonVPN', plateform: 'MacOS', link: 'https://protonvpn.com/download/' },
        { name: 'ProtonVPN', plateform: 'Linux', link: 'https://protonvpn.com/download/' }
    ];
    return (
        <>
            <Text className="bold">ProtonVPN</Text>
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

export default ProtonVPNClients;
