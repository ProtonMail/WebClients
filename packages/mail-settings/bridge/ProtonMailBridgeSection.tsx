import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import Select from '@proton/components/components/select/Select';
import UpgradeBanner from '@proton/components/containers/account/UpgradeBanner';
import { IcBrandApple } from '@proton/icons/icons/IcBrandApple';
import { IcBrandLinux } from '@proton/icons/icons/IcBrandLinux';
import { IcBrandWindows } from '@proton/icons/icons/IcBrandWindows';
import metrics from '@proton/metrics/metricsInstance';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { VersionLoadError } from '@proton/shared/lib/apps/desktopVersions';
import {
    APP_UPSELL_REF_PATH,
    BRAND_NAME,
    MAIL_APP_NAME,
    MAIL_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/ref';
import { getBridgeURL, getStaticURL } from '@proton/shared/lib/helpers/url';
import { semver } from '@proton/utils/semver';

interface BridgeClient {
    id: string;
    icon: ReactNode;
    platform: string;
    version: string;
    versionFileURL: string;
    downloads: string[];
}

interface BridgeRelease {
    CategoryName: string;
    Version: string;
    ReleaseDate: string;
    File: BridgeFile[];
}

interface BridgeFile {
    Url: string;
    Sha512CheckSum: string;
    Identifier: string;
}

const initialBridgeClients: BridgeClient[] = [
    {
        id: 'windows',
        icon: <IcBrandWindows size={12} className="mb-4" />,
        platform: 'Windows',
        versionFileURL: 'windows/x86/v1/version.json',
        version: 'Latest',
        downloads: ['https://proton.me/download/bridge/Bridge-Installer.exe'],
    },
    {
        id: 'apple',
        icon: <IcBrandApple size={12} className="mb-4" />,
        platform: 'macOS',
        versionFileURL: 'darwin/universal/v1/version.json',
        version: 'Latest',
        downloads: ['https://proton.me/download/bridge/Bridge-Installer.dmg'],
    },
    {
        id: 'linux',
        icon: <IcBrandLinux size={12} className="mb-4" />,
        platform: 'GNU/Linux',
        versionFileURL: 'linux/x86/v1/version.json',
        version: 'Latest',
        downloads: ['https://proton.me/bridge/download'],
    },
];

const fetchBridgeVersion = async (bridgeClient: BridgeClient): Promise<BridgeClient> => {
    try {
        const response = await fetch(getStaticURL(`/download/bridge/${bridgeClient.versionFileURL}`)).catch((error) => {
            throw new VersionLoadError('NETWORK_ERROR', error.message);
        });

        if (!response.ok) {
            throw new VersionLoadError('HTTP_ERROR', `${response.status} ${response.statusText}`);
        }
        const jsonResponse = await response.json().catch((error) => {
            {
                throw new VersionLoadError('FORMAT_ERROR', error.message);
            }
        });

        const latestStableRelease: BridgeRelease = jsonResponse.Releases.filter(
            (release: BridgeRelease) => release.CategoryName === 'Stable'
        )
            .sort((a: BridgeRelease, b: BridgeRelease) => semver(b.Version) - semver(a.Version))
            .shift();

        const installerDownloads: string[] = latestStableRelease.File.filter(
            (file) => file.Identifier === 'installer'
        ).map((file) => file.Url);

        return {
            ...bridgeClient,
            version: latestStableRelease.Version,
            downloads: installerDownloads,
        };
    } catch (e: any) {
        const platform = (() => {
            switch (bridgeClient.id) {
                case 'windows':
                    return 'windows';
                case 'linux':
                    return 'linux';
                default:
                    return 'macos';
            }
        })();

        metrics.core_version_json_failed_total.increment({
            error: e.name ?? 'FORMAT_ERROR',
            product: 'bridge',
            platform,
        });

        if (bridgeClient.id === 'linux') {
            return {
                ...bridgeClient,
                version: c('Bridge version load failed').t`Failed to find latest version`,
            };
        }
    }
    return bridgeClient;
};

export const ProtonMailBridgeSection = () => {
    const [{ hasPaidMail }] = useUser();

    const fileTypes = new Map([
        ['.exe', c('OS compatibility').t`.exe (64-bit)`],
        ['.dmg', c('OS compatibility').t`.dmg (12.0 or later)`],
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
            <DashboardCard key={id}>
                <DashboardCardContent className="h-full flex flex-column flex-nowrap items-center">
                    {icon}

                    <h3 className="text-bold text-xl m-0 text-center">{c('Title').t`Bridge for ${platform}`}</h3>

                    <span className="mb-4 text-center">{version}</span>

                    {downloads.length > 1 && (
                        <>
                            <label htmlFor="select-linux-platforms" className="sr-only">{c('Label')
                                .t`Select Linux platform`}</label>
                            <Select
                                id="select-linux-platforms"
                                value={linuxLink}
                                options={options}
                                onChange={handleSelect}
                                className="mb-4"
                            />
                        </>
                    )}

                    {downloads.length > 0 && (
                        <ButtonLike
                            as="a"
                            color="norm"
                            shape="solid"
                            className="w-full mt-auto"
                            href={id === 'linux' ? linuxLink : downloads[0]}
                            target="_self"
                            aria-label={c('Action').t`Download Bridge for ${platform}`}
                        >
                            {c('Action').t`Download`}
                        </ButtonLike>
                    )}
                </DashboardCardContent>
            </DashboardCard>
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
        <DashboardGrid columns={hasPaidMail ? 3 : undefined}>
            <DashboardGridSectionHeader
                title={c('Title').t`${MAIL_APP_NAME} Bridge`}
                subtitle={
                    <>
                        {c('Info')
                            .t`You can use ${MAIL_APP_NAME} with any desktop email client that supports IMAP/SMTP, including Outlook, Apple Mail, and Thunderbird.`}
                        {hasPaidMail && (
                            <>
                                {' '}
                                <Href href={getBridgeURL()}>{c('Link').t`Learn more`}</Href>
                            </>
                        )}
                    </>
                }
            />
            {hasPaidMail ? (
                bridgeClients.map(renderBox)
            ) : (
                <UpgradeBanner promotion upsellPath={upsellRef}>
                    {c('new_plans: upgrade').t`Included with ${plus}, ${bundle}, and ${BRAND_NAME} for Business.`}
                </UpgradeBanner>
            )}
        </DashboardGrid>
    );
};
