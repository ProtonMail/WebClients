import { useEffect } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { Pill } from '@proton/atoms/Pill';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { FeatureCode, useFeature } from '../..';
import { Icon, IconName } from '../../components';
import { SettingsParagraph, SettingsSectionWide } from '../account';
import useInboxDesktopVersion, { DesktopRelease } from './useInboxDesktopVersion';

interface DownloadSectionProps {
    release: DesktopRelease;
    icon: IconName;
    platform: 'Windows' | 'macOS';
    isBeta?: boolean;
}

const DownloadSection = ({ release, icon, platform, isBeta }: DownloadSectionProps) => {
    const { Version, File } = release;
    return (
        <div className="flex">
            <div className="border p-7 flex-1 rounded flex flex-column items-center">
                <Icon size={12} name={icon} className="mb-4" />
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

const InboxDesktopSettingsSection = () => {
    const { windowsApp, macosApp } = useInboxDesktopVersion();
    const isWindowsAppOK = windowsApp?.early?.File?.Url && windowsApp?.early?.Version;
    const isMacosAppOK = macosApp?.early?.File?.Url && macosApp?.early?.Version;

    const { update, feature } = useFeature(FeatureCode.NotificationInboxDesktopApp);
    useEffect(() => {
        if (update && feature?.Value) {
            update(false);
        }
    }, []);

    return (
        <SettingsSectionWide>
            <SettingsParagraph
                inlineLearnMore
                className="mt-0 mb-4"
                learnMoreUrl={getKnowledgeBaseUrl('/mail-desktop-app')}
            >
                {c('Info').t`Fast and focused. Email and calendar, right on your desktop.`}
            </SettingsParagraph>

            <div className="mt-8 grid-column-2 grid-auto-fill gap-4">
                {isWindowsAppOK && (
                    <DownloadSection release={windowsApp.early} icon="brand-windows" platform="Windows" isBeta />
                )}
                {isMacosAppOK && (
                    <DownloadSection release={macosApp.early} icon="brand-apple" platform="macOS" isBeta />
                )}
            </div>
        </SettingsSectionWide>
    );
};

export default InboxDesktopSettingsSection;
