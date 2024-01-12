import { c } from 'ttag';

import {
    getElectronAppVersion,
    isElectronApp,
    isElectronOnMac,
    isElectronOnWindows,
} from '@proton/shared/lib/helpers/desktop';

import useInboxDesktopVersion, { DesktopClient } from '../desktop/useInboxDesktopVersion';
import TopBanner from './TopBanner';

const doesEarlyVersionNeedsManualUpdate = (app: DesktopClient, version: string) => {
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
            {c('Action').t`update the application`}
        </a>
    );
};

const InboxDesktopOutdatedApp = () => {
    const version = getElectronAppVersion();
    const { windowsApp, macosApp, loading } = useInboxDesktopVersion();

    if (!isElectronApp() || !version || loading) {
        return null;
    }

    if (isElectronOnMac() && macosApp && doesEarlyVersionNeedsManualUpdate(macosApp, '0.9.1')) {
        const downloadUpdate = <DownloadButton app={macosApp} key="download-update-macos" />;
        return (
            <TopBanner className="bg-warning">{c('Action')
                .jt`This version is out of date. For best performance, ${downloadUpdate}.`}</TopBanner>
        );
    }

    if (isElectronOnWindows() && windowsApp && doesEarlyVersionNeedsManualUpdate(windowsApp, version)) {
        const downloadUpdate = <DownloadButton app={windowsApp} key="download-update-windows" />;
        return (
            <TopBanner className="bg-warning">{c('Action')
                .jt`This version is out of date. For best performance, ${downloadUpdate}.`}</TopBanner>
        );
    }

    return null;
};

export default InboxDesktopOutdatedApp;
