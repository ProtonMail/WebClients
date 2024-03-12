import { useEffect, useState } from 'react';

import useLoading from '@proton/hooks/useLoading';
import { DESKTOP_PLATFORMS, RELEASE_CATEGORIES } from '@proton/shared/lib/constants';
import { getDownloadUrl } from '@proton/shared/lib/helpers/url';

export interface DesktopVersion {
    CategoryName: RELEASE_CATEGORIES;
    Version: string;
    ReleaseDate: string;
    File: {
        Url?: string; // TODO change this to required after destkop app GA
        Sha512CheckSum: string;
    }[];
    ReleaseNotes: {
        Type: string;
        Notes: string[];
    }[];
    RolloutProportion?: number;
    ManualUpdate: string[];
}

const initialLinuxClients: DesktopVersion = {
    CategoryName: RELEASE_CATEGORIES.EARLY_ACCESS,
    Version: '1.0.0',
    ReleaseDate: '2024-03-14',
    File: [
        {
            Url: undefined,
            Sha512CheckSum: '',
        },
        {
            Url: undefined,
            Sha512CheckSum: '',
        },
    ],
    ReleaseNotes: [],
    RolloutProportion: 1,
    ManualUpdate: [],
};

const initialWindowsClient: DesktopVersion = {
    CategoryName: RELEASE_CATEGORIES.STABLE,
    Version: '1.0.0',
    ReleaseDate: '2024-03-14',
    File: [
        {
            Url: getDownloadUrl('/mail/windows/ProtonMail-desktop-setup.exe'),
            Sha512CheckSum: '',
        },
    ],
    ReleaseNotes: [],
    RolloutProportion: 1,
    ManualUpdate: [],
};

const initialMacosClient: DesktopVersion = {
    CategoryName: RELEASE_CATEGORIES.STABLE,
    Version: '1.0.0',
    ReleaseDate: '2024-03-14',
    File: [
        {
            Url: getDownloadUrl('/mail/windows/ProtonMail-desktop-setup.exe'),
            Sha512CheckSum: '',
        },
    ],
    ReleaseNotes: [],
    RolloutProportion: 1,
    ManualUpdate: ['0.9.0', '0.9.1'],
};

const fetchDesktopClient = async (platform: DESKTOP_PLATFORMS): Promise<DesktopVersion[] | undefined> => {
    try {
        const response = await fetch(getDownloadUrl(`/mail/${platform}/version.json`));
        if (!response.ok) {
            throw new Error(response.statusText);
        }

        const res = await response.json();
        return res.Releases;
    } catch (e: any) {
        return undefined;
    }
};

const { WINDOWS, MACOS, LINUX } = DESKTOP_PLATFORMS;

const useInboxDesktopVersion = () => {
    const [loading, withLoading] = useLoading(true);

    const [windowsApp, setWindowsApp] = useState<DesktopVersion | undefined>(initialWindowsClient);
    const [macosApp, setMacosApp] = useState<DesktopVersion | undefined>(initialMacosClient);
    const [linuxApp, setLinuxApp] = useState<DesktopVersion | undefined>(initialLinuxClients);
    const [allLinuxVersions, setAllLinuxVersions] = useState<DesktopVersion[]>([]);

    useEffect(() => {
        const fetchDesktopVersion = async () => {
            const promises = [fetchDesktopClient(WINDOWS), fetchDesktopClient(MACOS), fetchDesktopClient(LINUX)];
            const [windowsClient, macosClient, linuxClient] = await Promise.all(promises);

            if (windowsClient) {
                setWindowsApp(windowsClient[0]);
            }

            if (macosClient) {
                setMacosApp(macosClient[0]);
            }

            if (linuxClient) {
                setLinuxApp(linuxClient[0]);
                setAllLinuxVersions(linuxClient);
            }
        };

        withLoading(fetchDesktopVersion());
    }, []);

    return { windowsApp, macosApp, linuxApp, allLinuxVersions, loading };
};

export default useInboxDesktopVersion;
