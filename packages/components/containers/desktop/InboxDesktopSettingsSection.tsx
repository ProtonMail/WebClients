import type { PropsWithChildren } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Pill } from '@proton/atoms/Pill/Pill';
import Icon from '@proton/components/components/icon/Icon';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import type { IconName } from '@proton/icons/types';
import { getApplicationNameWithPlatform } from '@proton/shared/lib/apps/getApplicationNameWithPlatform';
import { DESKTOP_PLATFORMS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import type { DesktopVersion } from '@proton/shared/lib/desktop/DesktopVersion';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import useInboxDesktopVersion from './useInboxDesktopVersion';

interface DownloadSectionProps extends PropsWithChildren {
    version: string;
    icon: IconName;
    platform: DESKTOP_PLATFORMS;
    isBeta?: boolean;
}

const DownloadDropdown = ({ app }: { app: DesktopVersion }) => {
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
            <Button color="norm" onClick={handleClick} fullWidth aria-describedby="download-button-description">{c(
                'Action'
            ).t`Download`}</Button>
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

const DownloadCard = ({ version, icon, platform, isBeta, children }: DownloadSectionProps) => {
    const linkSnapStore = (
        <a key="snap-store-link" href="https://snapcraft.io/proton-mail" target="_blank" rel="noopener noreferrer">
            {
                // translator: "Snap store" is a proper noun (Ubuntu's app store). Full sentence: "On Ubuntu? You can also download the app through the Snap store"
                c('Link').t`Snap store`
            }
        </a>
    );

    return (
        <div className="flex">
            <div className="border p-7 flex-1 rounded flex flex-column items-center">
                <Icon size={12} name={icon} className="mb-4" />
                <h3 className="text-bold text-xl m-0 text-center">
                    {getApplicationNameWithPlatform(MAIL_APP_NAME, platform)}
                </h3>
                {version.length ? (
                    <div className="flex gap-2 items-baseline">
                        <span className="text-center">{c('Info').jt`Version ${version}`}</span>
                        {isBeta && <Pill className="mt-2">{c('Label').t`Beta`}</Pill>}
                    </div>
                ) : null}

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
            </div>
        </div>
    );
};

export const InboxDesktopSettingsSection = () => {
    const { windowsApp, macosApp, linuxApp } = useInboxDesktopVersion();

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
                <DownloadCard
                    version={windowsApp.Version}
                    icon="brand-windows"
                    platform={DESKTOP_PLATFORMS.WINDOWS}
                    isBeta={windowsApp.CategoryName === 'EarlyAccess'}
                >
                    <DownloadButton link={windowsApp.File[0]!.Url} ariaLabel={c('Action').t`Download for Windows`} />
                </DownloadCard>
                <DownloadCard
                    version={macosApp.Version}
                    icon="brand-apple"
                    platform={DESKTOP_PLATFORMS.MACOS}
                    isBeta={macosApp.CategoryName === 'EarlyAccess'}
                >
                    <DownloadButton link={macosApp.File[0]!.Url} ariaLabel={c('Action').t`Download for macOS`} />
                </DownloadCard>
                <DownloadCard version={linuxApp.Version} icon="brand-linux" platform={DESKTOP_PLATFORMS.LINUX}>
                    {linuxApp.Version && <DownloadDropdown app={linuxApp} />}
                </DownloadCard>
            </div>
        </SettingsSectionWide>
    );
};
