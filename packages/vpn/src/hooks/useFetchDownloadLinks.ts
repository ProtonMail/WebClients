import { useEffect, useState } from 'react';

import { c } from 'ttag';

const MAC_UPDATE_ENDPOINT = 'https://protonvpn.com/download/macos-update5.xml';
const MAC_UPDATE_LEGACY_ENDPOINT = 'https://protonvpn.com/download/macos-update2.xml';

// Hardcoded URLs for older macOS versions because newer versions of these XML files
// do not include the older versions and for performance reasons we want
// to avoid fetching multiple large XML files just to get a few download URLs
const MAC_LEGACY_URL = 'https://protonvpn.com/download/ProtonVPN_mac_v1.9.6.dmg';
const MAC_BIG_SUR_URL = 'https://protonvpn.com/download/ProtonVPN_mac_v3.3.6.dmg';
const MAC_CATALINA_URL = 'https://protonvpn.com/download/ProtonVPN_mac_v3.0.22.dmg';
const WIN_UPDATE_ENDPOINT = 'https://protonvpn.com/download/windows/x64/v1/version.json';
const WIN_UPDATE_ENDPOINT_ARM64 = 'https://protonvpn.com/download/windows/arm64/v1/version.json';

type MacXmlItem = {
    minimumSystemVersion: number;
    enclosure: { '@_url': string };
    channel?: string;
};

type MacXml = {
    rss: {
        channel: {
            item: MacXmlItem[];
        };
    };
};

// Serve VPN downloads from a domain that can be verified by clients, not hosted by cloudflare
const replaceDownloadUrl = (url: string | undefined): string | undefined => {
    if (!url) {
        return undefined;
    }

    return url.replace('vpn.protondownload.com', 'protonvpn.com');
};

const getMacItemUrl = (item: MacXmlItem | undefined): string | undefined => {
    if (!item) {
        return undefined;
    }

    return replaceDownloadUrl(item.enclosure['@_url']);
};

type Links = { title: () => string; link: string }[];

const fetchVpnMacosDownloadLink = async (): Promise<Links | undefined> => {
    try {
        const [macUpdate, macLegacyUpdate, { XMLParser }] = await Promise.all([
            fetch(MAC_UPDATE_ENDPOINT, { method: 'GET' }),

            fetch(MAC_UPDATE_LEGACY_ENDPOINT, { method: 'GET' }),
            import('fast-xml-parser'),
        ]);
        const macText = await macUpdate.text();
        const macXml = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true }).parse(macText) as MacXml;

        const macLegacyText = await macLegacyUpdate.text();
        const macLegacyXml = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true }).parse(
            macLegacyText
        ) as MacXml;

        const legacyItems = macLegacyXml.rss.channel.item;
        const legacy = getMacItemUrl(legacyItems[0]);

        const items = macXml.rss.channel.item.filter((item) => !item.channel);
        const ventura = getMacItemUrl(items.find((item) => item.minimumSystemVersion.toString().startsWith('13')));
        const monterey = getMacItemUrl(items.find((item) => item.minimumSystemVersion.toString().startsWith('12')));
        const bigSur = getMacItemUrl(items.find((item) => item.minimumSystemVersion.toString().startsWith('11')));
        const catalina = getMacItemUrl(items.find((item) => item.minimumSystemVersion.toString().startsWith('10.15')));
        const release = getMacItemUrl(items.find((item) => item.minimumSystemVersion >= 14)) || monterey || legacy;

        const links: Links = [];
        if (release) {
            links.push({ link: release, title: () => c('Download').t`macOS 14 (Sonoma) or newer` });
        }
        if (ventura) {
            links.push({ link: ventura, title: () => c('Download').t`macOS Ventura` });
        }
        if (monterey) {
            links.push({ link: monterey, title: () => c('Download').t`macOS Monterey` });
        }
        links.push({ link: bigSur ?? MAC_BIG_SUR_URL, title: () => c('Download').t`macOS Big Sur` });
        links.push({ link: catalina ?? MAC_CATALINA_URL, title: () => c('Download').t`macOS Catalina` });
        links.push({ link: legacy ?? MAC_LEGACY_URL, title: () => c('Download').t`macOS Mojave or earlier` });
        return release ? links : undefined;
    } catch {
        return undefined;
    }
};

type WindowsJson = {
    Releases: {
        CategoryName: string;
        File: { Url: string };
    }[];
};

const fetchAndParseWindowsJson = async (url: string) => {
    const result = await fetch(url, { method: 'GET' });
    const data = (await result.json()) as WindowsJson;

    const release = data.Releases.find((item) => item.CategoryName === 'Stable');
    const downloadUrl = release?.File.Url;
    return replaceDownloadUrl(downloadUrl);
};

const fetchVpnWindowsDownloadLink = async (): Promise<Links | undefined> => {
    try {
        const [winUrl, winUrlArm64Url] = await Promise.all([
            fetchAndParseWindowsJson(WIN_UPDATE_ENDPOINT),
            fetchAndParseWindowsJson(WIN_UPDATE_ENDPOINT_ARM64),
        ]);

        const links: Links = [];
        if (winUrl) {
            links.push({ title: () => c('Download').t`Windows 10/11 (x64)`, link: winUrl });
        }
        if (winUrlArm64Url) {
            links.push({ title: () => c('Download').t`Windows 10/11 (ARM64)`, link: winUrlArm64Url });
        }

        return links;
    } catch (error) {
        return undefined;
    }
};

export function useFetchDownloadLinks(flag: boolean) {
    const [windows, setWindows] = useState<Links>();
    const [mac, setMac] = useState<Links>();

    useEffect(() => {
        const effect = () => {
            if (flag) {
                void fetchVpnWindowsDownloadLink().then(setWindows).catch();
            } else {
                setWindows([
                    {
                        title: () => c('Download').t`Windows 10/11 (x64)`,
                        link: 'https://protonvpn.com/download/ProtonVPN_v4.3.11_x64.exe',
                    },
                    {
                        title: () => c('Download').t`Windows 10/11 (ARM64)`,
                        link: 'https://protonvpn.com/download/ProtonVPN_v4.3.11_arm64.exe',
                    },
                ]);
            }
        };
        effect();
    }, [flag]);

    useEffect(() => {
        const effect = () => {
            if (flag) {
                void fetchVpnMacosDownloadLink().then(setMac).catch();
            } else {
                setMac([
                    {
                        title: () => c('Download').t`macOS 14 (Sonoma) or newer`,
                        link: 'https://protonvpn.com/download/macos/6.3.0/ProtonVPN_mac_v6.3.0.dmg',
                    },
                    {
                        title: () => c('Download').t`macOS Ventura`,
                        link: 'https://protonvpn.com/download/macos/5.1.0/ProtonVPN_mac_v5.1.0.dmg',
                    },
                    {
                        title: () => c('Download').t`macOS Monterey`,
                        link: 'https://protonvpn.com/download/macos/4.8.0/ProtonVPN_mac_v4.8.0.dmg',
                    },
                    {
                        title: () => c('Download').t`macOS Big Sur`,
                        link: 'https://protonvpn.com/download/ProtonVPN_mac_v3.3.6.dmg',
                    },
                    {
                        title: () => c('Download').t`macOS Catalina`,
                        link: 'https://protonvpn.com/download/ProtonVPN_mac_v3.0.22.dmg',
                    },
                    {
                        title: () => c('Download').t`macOS Mojave or earlier`,
                        link: 'https://protonvpn.com/download/ProtonVPN_mac_v1.9.6.dmg',
                    },
                ]);
            }
        };
        effect();
    }, [flag]);

    return { windows, mac };
}
