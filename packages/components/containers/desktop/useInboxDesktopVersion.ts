import { useEffect, useState } from 'react';

import useLoading from '@proton/hooks/useLoading';
import { DESKTOP_PLATFORMS, RELEASE_CATEGORIES } from '@proton/shared/lib/constants';
import { getDownloadUrl } from '@proton/shared/lib/helpers/url';

export interface DesktopVersion {
    CategoryName: RELEASE_CATEGORIES;
    Version: string;
    ReleaseDate: string;
    File: {
        Identifier?: string;
        Url: string;
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
    Version: '1.0.1',
    ReleaseDate: '2024-03-21',
    File: [
        {
            Identifier: '.deb (Ubuntu/Debian)',
            Url: getDownloadUrl('/mail/linux/ProtonMail-desktop-setup.deb'),
            Sha512CheckSum:
                'cc772a801ba6086ace8b313215c46352a88aea6627287b5219ae2963fde1d5d434f8d6ac9fd469a971693ec0d0813b387de8c94af021f41bad993d145937f293',
        },
        {
            Identifier: '.rpm (Fedora/RHEL)',
            Url: getDownloadUrl('/mail/linux/ProtonMail-desktop-setup.rpm'),
            Sha512CheckSum:
                'de38e6f11b91ab3ff5e987fe6b14d430a8911ec45b94ed7f95b758cb3d542b73cc0551142e4f94950209fa445bc8fdfd9ac3d13d50aafc183be829a0c01298e2',
        },
    ],
    ReleaseNotes: [],
    RolloutProportion: 1,
    ManualUpdate: [],
};

const initialWindowsClient: DesktopVersion = {
    CategoryName: RELEASE_CATEGORIES.STABLE,
    Version: '1.0.1',
    ReleaseDate: '2024-03-19',
    File: [
        {
            Url: getDownloadUrl('/mail/windows/ProtonMail-desktop-setup.exe'),
            Sha512CheckSum:
                '85aec07d7b4d4fe0fd5283c2beb3c70483e1ca16ca2f402afd9de36881d276d49bb0a3ae0a7236e7fc8601b6c813cc9310c8324812c6dd9d1078c1d691d9f49f',
        },
    ],
    ReleaseNotes: [],
    RolloutProportion: 1,
    ManualUpdate: [],
};

const initialMacosClient: DesktopVersion = {
    CategoryName: RELEASE_CATEGORIES.STABLE,
    Version: '1.0.1',
    ReleaseDate: '2024-03-19',
    File: [
        {
            Url: getDownloadUrl('/mail/windows/ProtonMail-desktop-setup.dmg'),
            Sha512CheckSum:
                '8351dae67cc059c832c47c268ad37d1c4d4712513766fa2d6bbfeb5ecfea83916f09808c9df2aa3a288e3fcaf076e2e42a56d7f360ca615d94b27e3f0086cf4b',
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
