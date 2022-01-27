import { useState, useEffect, ChangeEvent } from 'react';
import { c } from 'ttag';

import { Select, Icon, ButtonLike } from '../../components';
import { useUser } from '../../hooks';
import { SettingsParagraph, SettingsSectionWide, UpgradeBanner } from '../account';

import './ProtonMailBridgeSection.scss';

interface BridgeClient {
    id: string;
    icon: string;
    platform: string;
    versionFile: string;
    version: string;
    downloads: string[];
}

const initialBridgeClients: BridgeClient[] = [
    {
        id: 'windows',
        icon: 'brand-windows',
        platform: 'Windows',
        versionFile: 'version_windows.json',
        version: 'Latest',
        downloads: ['https://protonmail.com/download/bridge/Bridge-Installer.exe'],
    },
    {
        id: 'apple',
        icon: 'brand-macos',
        platform: 'macOS',
        versionFile: 'version_darwin.json',
        version: 'Latest',
        downloads: ['https://protonmail.com/download/bridge/Bridge-Installer.dmg'],
    },
    {
        id: 'linux',
        icon: 'brand-linux',
        platform: 'GNU/Linux',
        versionFile: 'version_linux.json',
        version: 'Latest',
        downloads: ['https://protonmail.com/bridge/download'],
    },
];

const fetchBridgeVersion = async (bridgeClient: BridgeClient): Promise<BridgeClient> => {
    try {
        const response = await fetch(`https://protonmail.com/download/bridge/${bridgeClient.versionFile}`);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        const jsonResponse = await response.json();
        return {
            ...bridgeClient,
            version: jsonResponse.stable.Version,
            downloads: jsonResponse.stable.Installers,
        };
    } catch (e: any) {
        if (bridgeClient.id === 'linux') {
            return {
                ...bridgeClient,
                version: c('Bridge version load failed').t`Failed to find latest version`,
            };
        }
    }
    return bridgeClient;
};

const ProtonMailBridgeSection = () => {
    const [{ hasPaidMail }] = useUser();

    const fileTypes = new Map([
        ['.exe', c('OS compatibility').t`.exe (64-bit)`],
        ['.dmg', c('OS compatibility').t`.dmg (10.12 or later)`],
        ['.deb', c('OS compatibility').t`.deb (for Debian/Ubuntu)`],
        ['.rpm', c('OS compatibility').t`.rpm (for Fedora/openSUSE)`],
        ['PKGBUILD', c('OS compatibility').t`PKGBUILD (for other distributions)`],
    ]);
    const getFileType = (link: string): string => {
        for (const [ext, fileType] of fileTypes) {
            if (link.endsWith(ext)) {
                return fileType;
            }
        }
        return '';
    };

    const [bridgeClients, setBridgeClients] = useState(initialBridgeClients);
    const [linuxLink, setLinuxLink] = useState(bridgeClients[2].downloads[0]);

    useEffect(() => {
        async function run() {
            const newBridgeClients = await Promise.all(bridgeClients.map(fetchBridgeVersion));
            setBridgeClients(newBridgeClients);
            setLinuxLink(newBridgeClients[2].downloads[0]);
        }
        void run();
    }, []);

    const handleSelect = ({ target }: ChangeEvent<HTMLSelectElement>) => setLinuxLink(target.value);

    const renderBox = ({ id, icon, platform, version, downloads }: BridgeClient) => {
        const options =
            downloads.map((d) => ({
                text: getFileType(d),
                value: d,
            })) || [];

        return (
            <div key={id} className="flex">
                <div className="border p2 flex-item-fluid rounded flex flex-column flex-align-items-center">
                    <Icon size={48} name={icon} className="mb1" />

                    <h3 className="text-bold text-xl m0 text-center">{c('Title').t`Bridge for ${platform}`}</h3>

                    <span className="bridge-client-version mb1 text-center">{version}</span>

                    {downloads.length > 1 && (
                        <Select value={linuxLink} options={options} onChange={handleSelect} className="mb1" />
                    )}

                    {downloads.length > 0 && (
                        <ButtonLike
                            as="a"
                            color="norm"
                            shape="solid"
                            className="w100 mtauto"
                            href={id === 'linux' ? linuxLink : downloads[0]}
                            target="_self"
                        >
                            {c('Action').t`Download`}
                        </ButtonLike>
                    )}
                </div>
            </div>
        );
    };

    return (
        <SettingsSectionWide>
            <SettingsParagraph
                className="mt0 mb1"
                learnMoreUrl={hasPaidMail ? 'https://protonmail.com/bridge/' : undefined}
            >
                {c('Info')
                    .t`You can use ProtonMail with any desktop email client that supports IMAP/SMTP, including Outlook, Apple Mail, and Thunderbird.`}
            </SettingsParagraph>
            {hasPaidMail ? (
                <div className="mt2 bridge-grid">{bridgeClients.map(renderBox)}</div>
            ) : (
                <UpgradeBanner>
                    {c('Info').t`Upgrade to a paid plan to unlock IMAP/SMTP support through ProtonMail Bridge.`}
                </UpgradeBanner>
            )}
        </SettingsSectionWide>
    );
};

export default ProtonMailBridgeSection;
