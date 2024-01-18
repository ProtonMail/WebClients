import { c } from 'ttag';

import {
    getElectronAppVersion,
    isElectronApp,
    isElectronOnMac,
    isElectronOnWindows,
} from '@proton/shared/lib/helpers/desktop';

import TopBanner from '../topBanners/TopBanner';
import useInboxDesktopVersion, { DesktopClient } from './useInboxDesktopVersion';

/**
 * Returns true if the application needs to be manually updated.
 *
 * We return false
 * 1. If the latests version in version.json is the same as the installed version
 * 2. If the latests version in version.json also requires ManualUpdate array
 *    For example, if the latest version is 0.9.1 and the ManualUpdate is [0.9.0, 0.9.1], no prompt since current version requires manual update.
 */
const doesEarlyVersionNeedsManualUpdate = (app: DesktopClient, version: string) => {
    if (app.early.Version === version || (app.early.Version && app.early.ManualUpdate?.includes(app.early.Version))) {
        return false;
    }

    return app?.early.ManualUpdate?.includes(version);
};

const DownloadButton = ({ app }: { app: DesktopClient }) => {
    return (
        <a
            target="_blank"
            rel="noopener noreferrer"
            className="link align-baseline text-left"
            href={app.early.File.Url}
        >
            {c('Action').t`Download now`}
        </a>
    );
};

const InboxDesktopOutdatedAppTopBanner = () => {
    const version = getElectronAppVersion();
    const { windowsApp, macosApp, loading } = useInboxDesktopVersion();

    if (!isElectronApp() || !version || loading) {
        return null;
    }

    if (isElectronOnMac() && macosApp && doesEarlyVersionNeedsManualUpdate(macosApp, version)) {
        const downloadUpdate = <DownloadButton app={macosApp} key="download-update-macos" />;
        return (
            <TopBanner className="bg-info">{c('Action')
                .jt`Important update available. To continue to use the app, please update to the latest version. ${downloadUpdate}`}</TopBanner>
        );
    }

    if (isElectronOnWindows() && windowsApp && doesEarlyVersionNeedsManualUpdate(windowsApp, version)) {
        const downloadUpdate = <DownloadButton app={windowsApp} key="download-update-windows" />;
        return (
            <TopBanner className="bg-info">{c('Action')
                .jt`Important update available. To continue to use the app, please update to the latest version. ${downloadUpdate}`}</TopBanner>
        );
    }

    return null;
};

export default InboxDesktopOutdatedAppTopBanner;
