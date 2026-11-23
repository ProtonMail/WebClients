import type { PropsWithChildren } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import { Pill } from '@proton/atoms/Pill/Pill';
import { SkeletonLoader } from '@proton/atoms/SkeletonLoader/SkeletonLoader';
import type { IconComponent } from '@proton/icons/component';
import { IcBrandApple } from '@proton/icons/icons/IcBrandApple';
import { IcBrandLinux } from '@proton/icons/icons/IcBrandLinux';
import { IcBrandWindows } from '@proton/icons/icons/IcBrandWindows';
import { getApplicationNameWithPlatform } from '@proton/shared/lib/apps/getApplicationNameWithPlatform';
import { DESKTOP_PLATFORMS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import type { DesktopVersion } from '@proton/shared/lib/desktop/DesktopVersion';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import Option from '../../components/option/Option';
import SelectTwo from '../../components/selectTwo/SelectTwo';
import useInboxDesktopVersion from './useInboxDesktopVersion';

interface DownloadSectionProps extends PropsWithChildren {
    version: string;
    icon: IconComponent;
    platform: DESKTOP_PLATFORMS;
    isBeta?: boolean;
    /** While the versions load, a skeleton holds the place of the version so the card doesn't jump. */
    loading?: boolean;
}

const DownloadDropdown = ({ app, disabled }: { app: DesktopVersion; disabled?: boolean }) => {
    const debUrl = app.File.find((file) => file.Url.endsWith('.deb'))!.Url;
    const debText = c('Download link').t`.deb for Debian / Ubuntu`;
    const rpmUrl = app.File.find((file) => file.Url.endsWith('.rpm'))!.Url;
    const rpmText = c('Download link').t`.rpm for Fedora / Red Hat`;

    const [value, setValue] = useState(debUrl);

    const handleClick = () => {
        if (isElectronMail) {
            void invokeInboxDesktopIPC({ type: 'openExternal', payload: value });
        } else {
            window.open(value, '_self');
        }
    };

    return (
        <div className="flex gap-2 w-full">
            <SelectTwo
                disabled={disabled}
                value={value}
                onChange={({ value }) => setValue(value)}
                id="download-button-description"
                aria-description={c('Label').t`Select Linux package format`}
            >
                <Option value={debUrl} title={debText}>
                    {debText}
                </Option>
                <Option value={rpmUrl} title={rpmText}>
                    {rpmText}
                </Option>
            </SelectTwo>
            <Button
                color="norm"
                onClick={handleClick}
                fullWidth
                disabled={disabled}
                aria-describedby="download-button-description"
            >{c('Action').t`Download`}</Button>
        </div>
    );
};

const DownloadButton = ({ link, ariaLabel }: { link?: string; ariaLabel?: string }) => {
    if (isElectronMail && link) {
        const handleClick = () => {
            void invokeInboxDesktopIPC({ type: 'openExternal', payload: link });
        };

        return (
            <Button color="norm" onClick={handleClick} fullWidth aria-label={ariaLabel}>{c('Action')
                .t`Download`}</Button>
        );
    }

    return (
        <ButtonLike as="a" color="norm" shape="solid" fullWidth href={link} target="_self" aria-label={ariaLabel}>
            {c('Action').t`Download`}
        </ButtonLike>
    );
};

const DownloadCard = ({ version, icon: Icon, platform, isBeta, loading, children }: DownloadSectionProps) => {
    const linkSnapStore = (
        <a key="snap-store-link" href="https://snapcraft.io/proton-mail" target="_blank" rel="noopener noreferrer">
            {
                // translator: "Snap store" is a proper noun (Ubuntu's app store). Full sentence: "On Ubuntu? You can also download the app through the Snap store"
                c('Link').t`Snap store`
            }
        </a>
    );

    return (
        <DashboardCard>
            <DashboardCardContent className="flex flex-column flex-nowrap items-center">
                <Icon size={12} className="mb-4" />
                <h3 className="text-bold text-xl m-0 text-center">
                    {getApplicationNameWithPlatform(MAIL_APP_NAME, platform)}
                </h3>
                {loading && (
                    <span className="text-center">
                        <SkeletonLoader className="inline-block align-middle" width="6em" height="1em" />
                    </span>
                )}
                {!loading && !!version.length && (
                    <div className="flex gap-2 items-baseline">
                        <span className="text-center">{c('Info').jt`Version ${version}`}</span>
                        {isBeta && <Pill className="mt-2">{c('Label').t`Beta`}</Pill>}
                    </div>
                )}

                <div className="mt-4 w-full">{children}</div>

                {platform === DESKTOP_PLATFORMS.LINUX && (
                    <div className="mt-4 pt-4 border-t text-sm text-center color-weak">
                        <b className="color-norm">{
                            // translator: "Ubuntu" is a proper noun (Linux distribution name) that should remain unchanged.  Complete sentence: "On Ubuntu? You can also download the app through the Snap store."
                            c('Info').t`On Ubuntu?`
                        }</b>{' '}
                        {
                            // translator: ${linkSnapStore} will be replaced with the "Snap store" link.  Complete sentence: "On Ubuntu? You can also download the app through the Snap store."
                            c('Download link').jt`You can also download the app through the ${linkSnapStore}.`
                        }
                    </div>
                )}
            </DashboardCardContent>
        </DashboardCard>
    );
};

export const InboxDesktopSettingsSection = () => {
    const { windowsApp, macosApp, linuxApp, loading } = useInboxDesktopVersion();

    return (
        <DashboardGrid columns={3}>
            <DashboardGridSectionHeader
                title={c('Title').t`Download the desktop app`}
                subtitle={
                    <>
                        {c('Info').t`Fast and focused. Email and calendar, right on your desktop.`}{' '}
                        <Href href={getKnowledgeBaseUrl('/mail-desktop-app')}>{c('Link').t`Learn more`}</Href>
                    </>
                }
            />
            <DownloadCard
                version={windowsApp.Version}
                icon={IcBrandWindows}
                platform={DESKTOP_PLATFORMS.WINDOWS}
                isBeta={windowsApp.CategoryName === 'EarlyAccess'}
                loading={loading}
            >
                <DownloadButton link={windowsApp.File[0]!.Url} ariaLabel={c('Action').t`Download for Windows`} />
            </DownloadCard>
            <DownloadCard
                version={macosApp.Version}
                icon={IcBrandApple}
                platform={DESKTOP_PLATFORMS.MACOS}
                isBeta={macosApp.CategoryName === 'EarlyAccess'}
                loading={loading}
            >
                <DownloadButton link={macosApp.File[0]!.Url} ariaLabel={c('Action').t`Download for macOS`} />
            </DownloadCard>
            <DownloadCard
                version={linuxApp.Version}
                icon={IcBrandLinux}
                platform={DESKTOP_PLATFORMS.LINUX}
                loading={loading}
            >
                {/* Disabled while loading so the card keeps its size. Keyed by version so the selected
                    package is reset to the loaded files */}
                {(loading || !!linuxApp.Version) && (
                    <DownloadDropdown key={linuxApp.Version} app={linuxApp} disabled={loading} />
                )}
            </DownloadCard>
        </DashboardGrid>
    );
};
