import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { APPS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import type { DesktopVersion } from '@proton/shared/lib/desktop/DesktopVersion';
import { hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';
import {
    electronAppVersion,
    isElectronMail,
    isElectronOnLinux as isLinux,
    isElectronOnMac as isMac,
    isElectronOnWindows as isWindows,
} from '@proton/shared/lib/helpers/desktop';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';
import { semver } from '@proton/utils/semver';

import TopBanner from '../topBanners/TopBanner';
import { openLinkInBrowser } from './openExternalLink';
import useInboxDesktopVersion from './useInboxDesktopVersion';

const MAC_DMG_URL = 'https://proton.me/download/mail/macos/ProtonMail-desktop.dmg';
const MAC_KEYCHAIN_PROMPT_KB_URL = 'https://proton.me/support/mail-mac-keychain-password-prompt';

/**
 * Linux is different from Windows and MacOS. There is no auto updates, this means that any user running a version that is not the latest
 * is running an outdated version. A manual update is required if that's the case.
 *
 * @param latestVersion Latest version of the electron app
 * @param currentVersion Current version of the electron app
 * @returns
 */
const isLinuxOutdated = (app: DesktopVersion, currentVersion: string) => {
    // We want to ignore less than 100% available rollouts until
    // the desktop app is ready to handle them.
    if (!hasInboxDesktopFeature('LatestVersionCheck') && app.RolloutProportion < 1) {
        return false;
    }

    return semver(app.Version) > semver(currentVersion);
};

/**
 * Returns true if the application needs to be manually updated.
 *
 * We return false
 * 1. If the latests version in version.json is the same as the installed version
 * 2. If the latests version in version.json also requires ManualUpdate array
 *
 * For example, if the latest version is 0.9.1 and the ManualUpdate is [0.9.0, 0.9.1], no prompt since current version requires manual update.
 */
const doesEarlyVersionNeedsManualUpdate = (app: DesktopVersion, version: string) => {
    // We want to ignore less than 100% available rollouts until
    // the desktop app is ready to handle them.
    if (!hasInboxDesktopFeature('LatestVersionCheck') && app.RolloutProportion < 1) {
        return false;
    }

    if (!app.ManualUpdate || app.Version === version || app.ManualUpdate.includes(app.Version)) {
        return false;
    }

    return app?.ManualUpdate?.includes(version);
};

const DownloadButton = ({ link }: { link: string }) => {
    // Linux updates redirect to get-the-apps internally
    if (isElectronMail && !isLinux) {
        return (
            <Button shape="underline" className="py-0 align-baseline" onClick={() => openLinkInBrowser(link)}>{c(
                'Action'
            ).t`Download now`}</Button>
        );
    }

    return (
        <a target="_blank" rel="noopener noreferrer" className="link align-baseline text-left" href={link}>
            {c('Action').t`Download now`}
        </a>
    );
};

const DisplayTopBanner = ({
    displayTopBanner,
    link,
    className,
}: {
    displayTopBanner: boolean;
    link?: string;
    className?: string;
}) => {
    if (!link || !displayTopBanner) {
        return null;
    }

    const downloadUpdate = <DownloadButton link={link} key="download-update" />;
    return (
        <TopBanner className={clsx('bg-info', className)}>{c('Action')
            .jt`Important update available. To continue to use the app, please update to the latest version. ${downloadUpdate}`}</TopBanner>
    );
};

const MacSigningMigrationTopBanner = ({ className }: { className?: string }) => {
    const downloadUpdate = <DownloadButton link={MAC_DMG_URL} key="download-update" />;
    const learnMore = (
        <Button
            shape="underline"
            className="py-0 align-baseline"
            onClick={() => openLinkInBrowser(MAC_KEYCHAIN_PROMPT_KB_URL)}
            key="learn-more"
        >{c('Link').t`Learn more`}</Button>
    );
    return (
        <TopBanner className={clsx('bg-warning', className)}>
            <span>{c('Info').jt`Please update ${MAIL_APP_NAME} to keep using the app. ${downloadUpdate}`}</span>
            <span className="block text-normal">
                {c('Info')
                    .jt`After updating, your Mac may ask for a password. Type the password you use to unlock your Mac, then click Always Allow to stay signed in. ${learnMore}`}
            </span>
        </TopBanner>
    );
};

const isMacSigningMigrationVersion = (version?: string) => {
    if (!version) {
        return false;
    }

    if (semver(version) < semver('1.13.0') || semver(version) > semver('1.15.0')) {
        return false;
    }

    return true;
};

const InboxDesktopOutdatedAppTopBanner = ({ className }: { className?: string }) => {
    const version = electronAppVersion;
    const { windowsApp, macosApp, linuxApp, isSnapPackage, loading } = useInboxDesktopVersion();
    const isUpdateBannerDisabled = useFlag('InboxDesktopManualUpdateBannerDisabled');
    const isMacSigningMigrationEnabled = useFlag('InboxDesktopMacSigningMigrationBanner');

    if (isElectronMail && isMacSigningMigrationEnabled && isMac && isMacSigningMigrationVersion(version)) {
        return <MacSigningMigrationTopBanner className={className} />;
    }

    if (!isElectronMail || isUpdateBannerDisabled || !version || loading) {
        return null;
    }

    const displayMac = (isMac && macosApp && doesEarlyVersionNeedsManualUpdate(macosApp, version)) || false;
    const displayWindows = (isWindows && windowsApp && doesEarlyVersionNeedsManualUpdate(windowsApp, version)) || false;
    const displayLinux = (isLinux && !isSnapPackage && linuxApp && isLinuxOutdated(linuxApp, version)) || false;

    const settingsSlug = getSlugFromApp(APPS.PROTONMAIL);

    return (
        <>
            <DisplayTopBanner
                className={className}
                displayTopBanner={displayMac}
                link={macosApp?.File?.[0].Url}
                key="download-update-macos"
            />
            <DisplayTopBanner
                className={className}
                displayTopBanner={displayWindows}
                link={windowsApp?.File?.[0].Url}
                key="download-update-windows"
            />
            <DisplayTopBanner
                className={className}
                displayTopBanner={displayLinux}
                link={getAppHref(`/${settingsSlug}/get-the-apps#proton-mail-desktop-apps`, APPS.PROTONACCOUNT)}
                key="download-update-linux"
            />
        </>
    );
};

export default InboxDesktopOutdatedAppTopBanner;
