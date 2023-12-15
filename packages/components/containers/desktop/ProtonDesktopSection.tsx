import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { Pill } from '@proton/atoms/Pill';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl, getStaticURL } from '@proton/shared/lib/helpers/url';

import { FeatureCode, useFeature } from '../..';
import { Icon, IconName } from '../../components';
import { SettingsParagraph, SettingsSectionWide } from '../account';

interface DesktopRelese {
    Version?: string;
    RolloutProportion: number;
    File: {
        Url?: string;
        Sha512CheckSum: string;
    };
}

interface DesktopClient {
    early: DesktopRelese;
}

const initialWindowsClient = (): DesktopClient => {
    return {
        early: {
            Version: '0.9.0',
            RolloutProportion: 0.1,
            File: {
                Url: getStaticURL('/download/mail/windows/ProtonMail-desktop-beta.exe'),
                Sha512CheckSum:
                    '686165d261dc8f940b59656b7b4c4d84ed5b5e9a92d0e97d372ee6e5048433fe59a4b0eac49e559ee41bbacb9bf78c0f40a038c88902b56f8ac87fb1a5791c67',
            },
        },
    };
};

const initialMacosClient = (): DesktopClient => {
    return {
        early: {
            Version: '0.9.0',
            RolloutProportion: 0.1,
            File: {
                Url: getStaticURL('/download/mail/macos/ProtonMail-desktop-beta.dmg'),
                Sha512CheckSum:
                    '8231c3cbbe1451a293f84de35b58d2a7b0d88d389d2c21e8cbab01777b1cf23ad81039ce9772de54e17a7cda9c7e899123827f9e86ef1485e443564a68bc6174',
            },
        },
    };
};

const fetchDesktopClient = async (platform: 'windows' | 'macos'): Promise<DesktopClient | undefined> => {
    try {
        const response = await fetch(getStaticURL(`/download/mail/${platform}/version.json`));
        if (!response.ok) {
            throw new Error(response.statusText);
        }

        const res = await response.json();
        const result = {
            early: {
                Version: res.early.Version ?? undefined,
                RolloutProportion: res.early.RolloutProportion ?? '',
                File: {
                    Url: res.early.File.Url ?? undefined,
                    Sha512CheckSum: res.early.File.Sha512CheckSum ?? '',
                },
            },
        };
        return result;
    } catch (e: any) {
        return undefined;
    }
};

interface DownloadSectionProps {
    release: DesktopRelese;
    icon: IconName;
    platform: 'Windows' | 'macOS';
    isBeta?: boolean;
}

const DownloadSection = ({ release, icon, platform, isBeta }: DownloadSectionProps) => {
    const { Version, File } = release;
    return (
        <div className="flex">
            <div className="border p-7 flex-1 rounded flex flex-column items-center">
                <Icon size={48} name={icon} className="mb-4" />
                <h3 className="text-bold text-xl m-0 text-center">{c('Title').t`For ${platform}`}</h3>
                <div className="flex gap-2 items-baseline">
                    {isBeta && <Pill className="mt-2 mb-4">{c('Label').t`Beta`}</Pill>}
                    <span className="mb-4 text-center">{Version}</span>
                </div>

                <ButtonLike as="a" color="norm" shape="solid" className="w-full mt-auto" href={File.Url} target="_self">
                    {c('Action').t`Download`}
                </ButtonLike>
            </div>
        </div>
    );
};

const ProtonMailBridgeSection = () => {
    const [windowApp, setWindowApp] = useState<DesktopClient | undefined>(initialWindowsClient());
    const [macosApp, setMacosApp] = useState<DesktopClient | undefined>(initialMacosClient());
    const isWindowsAppOK = windowApp?.early?.File?.Url && windowApp?.early?.Version;
    const isMacosAppOK = macosApp?.early?.File?.Url && macosApp?.early?.Version;

    const { update, feature } = useFeature(FeatureCode.NotificationInboxDesktopApp);
    useEffect(() => {
        if (update && feature?.Value) {
            update(false);
        }
    }, []);

    useEffect(() => {
        const fetchDesktopVersion = async () => {
            const windowsClient = await fetchDesktopClient('windows');
            if (windowsClient) {
                setWindowApp(windowsClient);
            }

            const macosClient = await fetchDesktopClient('macos');
            if (macosClient) {
                setMacosApp(macosClient);
            }
        };

        void fetchDesktopVersion();
    }, []);

    return (
        <SettingsSectionWide>
            <SettingsParagraph className="mt-0 mb-4" learnMoreUrl={getKnowledgeBaseUrl('/mail-desktop-app')}>
                {c('Info')
                    .t`Now available in beta, the desktop app lets you conveniently launch ${MAIL_APP_NAME} right from your desktop and stay focused with no browser distractions.`}
            </SettingsParagraph>

            <div className="mt-8 grid-column-2 grid-auto-fill gap-4">
                {isWindowsAppOK && (
                    <DownloadSection release={windowApp.early} icon="brand-windows" platform="Windows" isBeta />
                )}
                {isMacosAppOK && (
                    <DownloadSection release={macosApp.early} icon="brand-apple" platform="macOS" isBeta />
                )}
            </div>
        </SettingsSectionWide>
    );
};

export default ProtonMailBridgeSection;
