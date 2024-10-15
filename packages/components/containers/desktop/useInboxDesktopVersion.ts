import { useEffect, useState } from 'react';

import useEarlyAccess from '@proton/components/hooks/useEarlyAccess';
import useLoading from '@proton/hooks/useLoading';
import { DESKTOP_PLATFORMS, RELEASE_CATEGORIES } from '@proton/shared/lib/constants';
import { type DesktopVersion, VersionFileSchema } from '@proton/shared/lib/desktop/DesktopVersion';
import { getLatestRelease } from '@proton/shared/lib/desktop/getLatestRelease';
import { getInboxDesktopInfo, hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronOnLinux, isElectronOnMac, isElectronOnWindows } from '@proton/shared/lib/helpers/desktop';
import { getDownloadUrl } from '@proton/shared/lib/helpers/url';

const initialLinuxClients: DesktopVersion = {
    CategoryName: RELEASE_CATEGORIES.EARLY_ACCESS,
    Version: '',
    ReleaseDate: '',
    File: [
        {
            Identifier: '.deb (Ubuntu/Debian)',
            Url: getDownloadUrl('/mail/linux/ProtonMail-desktop-beta.deb'),
            Sha512CheckSum: '',
        },
        {
            Identifier: '.rpm (Fedora/RHEL)',
            Url: getDownloadUrl('/mail/linux/ProtonMail-desktop-beta.rpm'),
            Sha512CheckSum: '',
        },
    ],
    ReleaseNotes: [],
    RolloutProportion: 1,
    ManualUpdate: [],
};

const initialWindowsClient: DesktopVersion = {
    CategoryName: RELEASE_CATEGORIES.STABLE,
    Version: '',
    ReleaseDate: '',
    File: [
        {
            Url: getDownloadUrl('/mail/windows/ProtonMail-desktop.exe'),
            Sha512CheckSum: '',
        },
    ],
    ReleaseNotes: [],
    RolloutProportion: 1,
    ManualUpdate: [],
};

const initialMacosClient: DesktopVersion = {
    CategoryName: RELEASE_CATEGORIES.STABLE,
    Version: '',
    ReleaseDate: '',
    File: [
        {
            Url: getDownloadUrl('/mail/macos/ProtonMail-desktop.dmg'),
            Sha512CheckSum: '',
        },
    ],
    ReleaseNotes: [],
    RolloutProportion: 1,
    ManualUpdate: [],
};

const fetchDesktopClient = async (platform: DESKTOP_PLATFORMS) => {
    try {
        const response = await fetch(getDownloadUrl(`/mail/${platform}/version.json`));
        if (!response.ok) {
            throw new Error(response.statusText);
        }

        const json = await response.json();
        const res = VersionFileSchema.parse(json);
        return res.Releases;
    } catch (e: any) {
        return undefined;
    }
};

const { WINDOWS, MACOS, LINUX } = DESKTOP_PLATFORMS;

const useInboxDesktopVersion = () => {
    const { currentEnvironment } = useEarlyAccess();
    const [loading, withLoading] = useLoading(true);

    const [windowsApp, setWindowsApp] = useState<DesktopVersion>(initialWindowsClient);
    const [macosApp, setMacosApp] = useState<DesktopVersion>(initialMacosClient);
    const [linuxApp, setLinuxApp] = useState<DesktopVersion>(initialLinuxClients);

    useEffect(() => {
        const fetchDesktopVersion = async () => {
            const promises = [fetchDesktopClient(WINDOWS), fetchDesktopClient(MACOS), fetchDesktopClient(LINUX)];
            const [windowsClient, macosClient, linuxClient] = await Promise.all(promises);

            if (windowsClient) {
                setWindowsApp(
                    (previousWindowsApp) => getLatestRelease(currentEnvironment, windowsClient) || previousWindowsApp
                );
            }

            if (macosClient) {
                setMacosApp(
                    (previousMacosApp) => getLatestRelease(currentEnvironment, macosClient) || previousMacosApp
                );
            }

            if (linuxClient) {
                setLinuxApp(
                    (previousLinuxApp) => getLatestRelease(currentEnvironment, linuxClient) || previousLinuxApp
                );
            }
        };

        const fetchDesktopVersionFromElectron = async () => {
            const latestDesktopVersion = getInboxDesktopInfo('latestVersion');

            if (!latestDesktopVersion) {
                return;
            }

            if (isElectronOnWindows) {
                setWindowsApp(latestDesktopVersion);
            } else if (isElectronOnMac) {
                setMacosApp(latestDesktopVersion);
            } else if (isElectronOnLinux) {
                setLinuxApp(latestDesktopVersion);
            }
        };

        if (hasInboxDesktopFeature('LatestVersionCheck')) {
            void withLoading(fetchDesktopVersionFromElectron());
        } else {
            void withLoading(fetchDesktopVersion());
        }
    }, [currentEnvironment]);

    return { windowsApp, macosApp, linuxApp, loading };
};

export default useInboxDesktopVersion;
