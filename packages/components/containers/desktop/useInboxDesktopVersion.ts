import { useEffect, useState } from 'react';

import useLoading from '@proton/hooks/useLoading';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

export interface DesktopRelease {
    Version?: string;
    RolloutProportion: number;
    File: {
        Url?: string;
        Sha512CheckSum: string;
    };
    ManualUpdate?: string[];
}

export interface DesktopClient {
    early: DesktopRelease;
}

const initialWindowsClient = (): DesktopClient => {
    return {
        early: {
            Version: '0.9.0',
            RolloutProportion: 0.1,
            File: {
                Url: getStaticURL('/download/mail/windows/ProtonMail-desktop-beta.exe'),
                Sha512CheckSum:
                    '686165d261dc8f940b59656b7b4c4d84ed5b5e9a92d0e97d372ee6e5048433fe59a4b0eac49e559ee41bbacb9bf78c0f40a038c88902b56f8ac87fb1a5791c67',
            },
        },
    };
};

const initialMacosClient = (): DesktopClient => {
    return {
        early: {
            Version: '0.9.0',
            RolloutProportion: 0.1,
            File: {
                Url: getStaticURL('/download/mail/macos/ProtonMail-desktop-beta.dmg'),
                Sha512CheckSum:
                    '8231c3cbbe1451a293f84de35b58d2a7b0d88d389d2c21e8cbab01777b1cf23ad81039ce9772de54e17a7cda9c7e899123827f9e86ef1485e443564a68bc6174',
            },
            ManualUpdate: ['0.9.0', '0.9.1'],
        },
    };
};

const fetchDesktopClient = async (platform: 'windows' | 'macos'): Promise<DesktopClient | undefined> => {
    try {
        const response = await fetch(getStaticURL(`/download/mail/${platform}/version.json`));
        if (!response.ok) {
            throw new Error(response.statusText);
        }

        const res = await response.json();
        const result = {
            early: {
                Version: res.early.Version ?? undefined,
                RolloutProportion: res.early.RolloutProportion ?? '',
                File: {
                    Url: res.early.File.Url ?? undefined,
                    Sha512CheckSum: res.early.File.Sha512CheckSum ?? '',
                },
                ManualUpdate: res.early.ManualUpdate ?? [],
            },
        };
        return result;
    } catch (e: any) {
        return undefined;
    }
};

const useInboxDesktopVersion = () => {
    const [loading, withLoading] = useLoading(true);

    const [windowsApp, setWindowsApp] = useState<DesktopClient | undefined>(initialWindowsClient());
    const [macosApp, setMacosApp] = useState<DesktopClient | undefined>(initialMacosClient());

    useEffect(() => {
        const fetchDesktopVersion = async () => {
            const windowsClient = await fetchDesktopClient('windows');
            if (windowsClient) {
                setWindowsApp(windowsClient);
            }

            const macosClient = await fetchDesktopClient('macos');
            if (macosClient) {
                setMacosApp(macosClient);
            }
        };

        withLoading(fetchDesktopVersion());
    }, []);

    return { windowsApp, macosApp, loading };
};

export default useInboxDesktopVersion;
