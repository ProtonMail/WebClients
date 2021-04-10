import React, { useState } from 'react';
import { c } from 'ttag';

import { Select, Icon, Button } from '../../components';

import { SettingsParagraph, SettingsSectionWide } from '../account';

import './ProtonMailBridgeSection.scss';

interface BridgeClients {
    id: string;
    icon: string;
    platform: string;
    version: string;
    downloads: {
        link: string;
        fileType: string;
    }[];
}

const ProtonMailBridgeSection = () => {
    const bridgeClients: BridgeClients[] = [
        {
            id: 'windows',
            icon: 'windows',
            platform: 'Windows',
            version: 'v1.6.3 (64-bit)',
            downloads: [
                {
                    fileType: c('OS compatibility').t`.exe (64-bit)`,
                    link: 'https://protonmail.com/download/Bridge-Installer.exe',
                },
            ],
        },
        {
            id: 'apple',
            icon: 'apple',
            platform: 'macOS',
            version: 'v1.6.3',
            downloads: [
                {
                    fileType: c('OS compatibility').t`.dmg (10.12 or later)`,
                    link: 'https://protonmail.com/download/Bridge-Installer.dmg',
                },
            ],
        },
        {
            id: 'linux',
            icon: 'linux',
            platform: 'GNU/Linux',
            version: 'v1.6.3',
            downloads: [
                {
                    fileType: c('OS compatibility').t`.deb (for Debian/Ubuntu)`,
                    link: 'https://protonmail.com/download/bridge/protonmail-bridge_1.6.3-1_amd64.deb',
                },
                {
                    fileType: c('OS compatibility').t`.rpm (for Fedora/openSUSE)`,
                    link: 'https://protonmail.com/download/bridge/protonmail-bridge-1.6.3-1.x86_64.rpm',
                },
                {
                    fileType: c('OS compatibility').t`PKGBUILD (for other distributions)`,
                    link: 'https://protonmail.com/download/bridge/PKGBUILD',
                },
            ],
        },
    ];

    const [linuxLink, setLinuxLink] = useState(bridgeClients[2].downloads[0].link);

    const handleSelect = ({ target }: React.ChangeEvent<HTMLSelectElement>) => setLinuxLink(target.value);

    const renderBox = ({ id, icon, platform, version, downloads }: BridgeClients) => {
        const options =
            downloads.map((d) => ({
                text: d.fileType,
                value: d.link,
            })) || [];

        const handleClick = () => {
            window.open(id === 'linux' ? linuxLink : downloads[0].link, '_self');
        };

        return (
            <div key={id}>
                <div className="p2 bordered-container rounded flex flex-column flex-align-items-center">
                    <Icon size={48} name={icon} className="mb1" />

                    <h5 className="text-bold mb0">{c('Title').t`Bridge for ${platform}`}</h5>

                    <span className="bridge-client-version mb1">{version}</span>

                    {downloads.length > 1 && (
                        <Select value={linuxLink} options={options} onChange={handleSelect} className="mb1" />
                    )}

                    <Button color="norm" className="w100" onClick={handleClick}>{c('Title').t`Download`}</Button>
                </div>
            </div>
        );
    };

    return (
        <SettingsSectionWide>
            <SettingsParagraph learnMoreUrl="https://protonmail.com/bridge/">
                {c('Info')
                    .t`You can use ProtonMail with any desktop email client that supports IMAP/SMTP, including Outlook, Apple Mail, and Thunderbird.`}
            </SettingsParagraph>

            <div className="bridge-grid">{bridgeClients.map(renderBox)}</div>
        </SettingsSectionWide>
    );
};

export default ProtonMailBridgeSection;
