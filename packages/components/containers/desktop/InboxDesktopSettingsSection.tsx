import type { PropsWithChildren } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike, Pill } from '@proton/atoms';
import { DESKTOP_PLATFORMS } from '@proton/shared/lib/constants';
import type { DesktopVersion } from '@proton/shared/lib/desktop/DesktopVersion';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import type { IconName } from '../../components';
import { Icon, Option, SelectTwo } from '../../components';
import { SettingsParagraph, SettingsSectionWide } from '../account';
import useInboxDesktopVersion from './useInboxDesktopVersion';

interface DownloadSectionProps extends PropsWithChildren {
    version: string;
    icon: IconName;
    platform: DESKTOP_PLATFORMS;
    isBeta?: boolean;
}

const getButtonName = (url: string) => {
    if (url.includes('.deb')) {
        return c('Download link').t`.deb for Debian / Ubuntu`;
    } else if (url.includes('.rpm')) {
        return c('Download link').t`.rpm for Fedora / Red Hat`;
    }

    return '';
};

const DownloadDropdown = ({ app }: { app: DesktopVersion }) => {
    const [value, setValue] = useState(app.File[0].Url);

    const handleClick = () => {
        if (!value) {
            return;
        }

        if (isElectronMail) {
            invokeInboxDesktopIPC({ type: 'openExternal', payload: value });
        } else {
            window.open(value, '_self');
        }
    };

    return (
        <div className="flex gap-2 w-full">
            <SelectTwo value={value} onChange={({ value }) => setValue(value)}>
                {app.File.map((file) => {
                    const text = getButtonName(file.Url!);
                    return (
                        <Option key={file.Url} value={file.Url} title={text}>
                            {text}
                        </Option>
                    );
                })}
            </SelectTwo>
            <Button color="norm" onClick={handleClick} fullWidth>{c('Action').t`Download`}</Button>
        </div>
    );
};

const DownloadButton = ({ link }: { link?: string }) => {
    if (isElectronMail && link) {
        const handleClick = () => {
            invokeInboxDesktopIPC({ type: 'openExternal', payload: link });
        };

        return <Button color="norm" onClick={handleClick} fullWidth>{c('Action').t`Download`}</Button>;
    }

    return (
        <ButtonLike as="a" color="norm" shape="solid" fullWidth href={link} target="_self">
            {c('Action').t`Download`}
        </ButtonLike>
    );
};

const getPlatformCopy = (platform: DESKTOP_PLATFORMS) => {
    switch (platform) {
        case DESKTOP_PLATFORMS.WINDOWS:
            return c('Title').t`For Windows`;
        case DESKTOP_PLATFORMS.MACOS:
            return c('Title').t`For macOS`;
        case DESKTOP_PLATFORMS.LINUX:
            return c('Title').t`For Linux`;
    }
};

const DownloadCard = ({ version, icon, platform, isBeta, children }: DownloadSectionProps) => {
    return (
        <div className="flex">
            <div className="border p-7 flex-1 rounded flex flex-column items-center">
                <Icon size={12} name={icon} className="mb-4" />
                <h3 className="text-bold text-xl m-0 text-center">{getPlatformCopy(platform)}</h3>
                <div className="flex gap-2 items-baseline">
                    {isBeta && <Pill className="mt-2 mb-4">{c('Label').t`Beta`}</Pill>}
                    <span className="mb-4 text-center">{version}</span>
                </div>

                {children}
            </div>
        </div>
    );
};

const InboxDesktopSettingsSection = () => {
    const { windowsApp, macosApp, linuxApp } = useInboxDesktopVersion();
    const isWindowsAppOK = windowsApp && windowsApp.File[0]?.Url && windowsApp.Version;
    const isMacosAppOK = macosApp && macosApp.File[0]?.Url && macosApp.Version;
    const isLinuxAppOK = linuxApp && linuxApp.Version && linuxApp.File.every((file) => file.Url);

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
                    <DownloadCard
                        version={windowsApp.Version}
                        icon="brand-windows"
                        platform={DESKTOP_PLATFORMS.WINDOWS}
                        isBeta={windowsApp.CategoryName === 'EarlyAccess'}
                    >
                        <DownloadButton link={windowsApp.File[0].Url} />
                    </DownloadCard>
                )}
                {isMacosAppOK && (
                    <DownloadCard
                        version={macosApp.Version}
                        icon="brand-apple"
                        platform={DESKTOP_PLATFORMS.MACOS}
                        isBeta={macosApp.CategoryName === 'EarlyAccess'}
                    >
                        <DownloadButton link={macosApp.File[0].Url} />
                    </DownloadCard>
                )}
                {isLinuxAppOK && (
                    <DownloadCard version={linuxApp.Version} icon="brand-linux" platform={DESKTOP_PLATFORMS.LINUX}>
                        <DownloadDropdown app={linuxApp} />
                    </DownloadCard>
                )}
            </div>
        </SettingsSectionWide>
    );
};

export default InboxDesktopSettingsSection;
