import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import Icon, { type IconName } from '@proton/components/components/icon/Icon';
import {
    APP_UPSELL_REF_PATH,
    BRAND_NAME,
    MAIL_APP_NAME,
    MAIL_UPSELL_PATHS,
    PLANS,
    PLAN_NAMES,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getBridgeURL, getStaticURL } from '@proton/shared/lib/helpers/url';

import { Select } from '../../components';
import { useUser } from '../../hooks';
import { SettingsParagraph, SettingsSectionWide, UpgradeBanner } from '../account';

import './ProtonMailBridgeSection.scss';

interface BridgeClient {
    id: string;
    icon: IconName;
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
        // NOTE: These URLs don't exist on proton.me yet, and are replaced with the version.json anyway
        downloads: ['https://protonmail.com/download/bridge/Bridge-Installer.exe'],
    },
    {
        id: 'apple',
        icon: 'brand-apple',
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
        const response = await fetch(getStaticURL(`/download/bridge/${bridgeClient.versionFile}`));
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
                <div className="border p-7 flex-1 rounded flex flex-column items-center">
                    <Icon size={12} name={icon} className="mb-4" />

                    <h3 className="text-bold text-xl m-0 text-center">{c('Title').t`Bridge for ${platform}`}</h3>

                    <span className="bridge-client-version mb-4 text-center">{version}</span>

                    {downloads.length > 1 && (
                        <Select value={linuxLink} options={options} onChange={handleSelect} className="mb-4" />
                    )}

                    {downloads.length > 0 && (
                        <ButtonLike
                            as="a"
                            color="norm"
                            shape="solid"
                            className="w-full mt-auto"
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

    const plus = PLAN_NAMES[PLANS.MAIL];
    const bundle = PLAN_NAMES[PLANS.BUNDLE];

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.BANNER,
        feature: MAIL_UPSELL_PATHS.BRIDGE,
        isSettings: true,
    });

    return (
        <SettingsSectionWide>
            <SettingsParagraph className="mt-0 mb-4" learnMoreUrl={hasPaidMail ? getBridgeURL() : undefined}>
                {c('Info')
                    .t`You can use ${MAIL_APP_NAME} with any desktop email client that supports IMAP/SMTP, including Outlook, Apple Mail, and Thunderbird.`}
            </SettingsParagraph>
            {hasPaidMail ? (
                <div className="mt-8 bridge-grid">{bridgeClients.map(renderBox)}</div>
            ) : (
                <UpgradeBanner upsellPath={upsellRef}>
                    {c('new_plans: upgrade').t`Included with ${plus}, ${bundle}, and ${BRAND_NAME} for Business.`}
                </UpgradeBanner>
            )}
        </SettingsSectionWide>
    );
};

export default ProtonMailBridgeSection;
