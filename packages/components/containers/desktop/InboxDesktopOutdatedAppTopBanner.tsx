import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { semver } from '@proton/pass/utils/string/semver';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import type { DesktopVersion } from '@proton/shared/lib/desktop/DesktopVersion';
import { hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';
import {
    electronAppVersion,
    isElectronMail,
    isElectronOnLinux as isLinux,
    isElectronOnMac as isMac,
    isElectronOnWindows as isWindows,
} from '@proton/shared/lib/helpers/desktop';
import { useFlag } from '@proton/unleash';

import TopBanner from '../topBanners/TopBanner';
import { openLinkInBrowser } from './openExternalLink';
import useInboxDesktopVersion from './useInboxDesktopVersion';

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
    if (isElectronMail) {
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

const DisplayTopBanner = ({ displayTopBanner, link }: { displayTopBanner: boolean; link?: string }) => {
    if (!link || !displayTopBanner) {
        return null;
    }

    const downloadUpdate = <DownloadButton link={link} />;
    return (
        <TopBanner className="bg-info">{c('Action')
            .jt`Important update available. To continue to use the app, please update to the latest version. ${downloadUpdate}`}</TopBanner>
    );
};

const InboxDesktopOutdatedAppTopBanner = () => {
    const version = electronAppVersion;
    const { windowsApp, macosApp, linuxApp, loading } = useInboxDesktopVersion();
    const isUpdateBannerDisabled = useFlag('InboxDesktopManualUpdateBannerDisabled');

    if (!isElectronMail || isUpdateBannerDisabled || !version || loading) {
        return null;
    }

    const displayMac = (isMac && macosApp && doesEarlyVersionNeedsManualUpdate(macosApp, version)) || false;
    const displayWindows = (isWindows && windowsApp && doesEarlyVersionNeedsManualUpdate(windowsApp, version)) || false;
    const displayLinux = (isLinux && linuxApp && isLinuxOutdated(linuxApp, version)) || false;

    return (
        <>
            <DisplayTopBanner
                displayTopBanner={displayMac}
                link={macosApp?.File?.[0].Url}
                key="download-update-macos"
            />
            <DisplayTopBanner
                displayTopBanner={displayWindows}
                link={windowsApp?.File?.[0].Url}
                key="download-update-windows"
            />
            <DisplayTopBanner
                displayTopBanner={displayLinux}
                link={getAppHref('/get-the-apps#proton-mail-desktop-apps', APPS.PROTONACCOUNT)}
                key="download-update-linux"
            />
        </>
    );
};

export default InboxDesktopOutdatedAppTopBanner;
