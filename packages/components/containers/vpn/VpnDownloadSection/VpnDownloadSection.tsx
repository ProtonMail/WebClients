import { useState } from 'react';

import { c } from 'ttag';

import { ButtonLike, DashboardCard, DashboardCardContent } from '@proton/atoms';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuLink from '@proton/components/components/dropdown/DropdownMenuLink';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import type { IconName } from '@proton/components/components/icon/Icon';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import type { Tab } from '@proton/components/components/tabs/Tabs';
import Tabs from '@proton/components/components/tabs/Tabs';
import { IcArrowDownLine, IcArrowOutSquare } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import appleAppStoreImage from './images/apple-app-store.svg';
import androidPreview from './images/download-preview-android.png';
import androidTVPreview from './images/download-preview-androidtv.png';
import appleTVPreview from './images/download-preview-appletv.png';
import chromePreview from './images/download-preview-chrome.png';
import firefoxPreview from './images/download-preview-firefox.png';
import firetvPreview from './images/download-preview-firetv.png';
import iOSPreview from './images/download-preview-iOS.png';
import linuxPreview from './images/download-preview-linux.png';
import macosPreview from './images/download-preview-macos.png';
import windowsPreview from './images/download-preview-windows.png';
import googlePlayStoreImage from './images/google-play-store.svg';

import './VpnDownloadSection.scss';

interface DownloadLink {
    title: () => string;
    link: string;
}

interface DownloadButton {
    title: () => string;
    links?: DownloadLink[];
    link?: string;
    style?: 'appstore' | 'external';
    image?: string;
}

interface TabContent {
    image?: string;
    hint?: string;
    downloadButton: DownloadButton;
    footnote?: {
        title: () => string;
        link: string;
    };
}

interface CategoryTab {
    title: () => string;
    icon: IconName;
    content: TabContent;
}

interface Category {
    tabs: CategoryTab[];
}

const downloadData = [
    {
        category: () => c('Download').t`Desktop`,
        tabs: [
            {
                title: () => c('Download').t`Windows`,
                icon: 'brand-windows' as IconName,
                content: {
                    image: windowsPreview,
                    downloadButton: {
                        title: () => c('Download').t`Download for Windows`,
                        links: [
                            {
                                title: () => c('Download').t`Windows 10/11 (x64)`,
                                link: 'https://vpn.protondownload.com/download/ProtonVPN_v4.2.2_x64.exe',
                            },
                            {
                                title: () => c('Download').t`Windows 10/11 (ARM64)`,
                                link: 'https://vpn.protondownload.com/download/ProtonVPN_v4.2.2_arm64.exe',
                            },
                            {
                                title: () => c('Download').t`Windows 8/8.1/7 or Windows 32-bit (ARM64)`,
                                link: 'https://vpn.protondownload.com/download/ProtonVPN_win_v2.4.3.exe',
                            },
                        ],
                    },
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://protonvpn.com/support/protonvpn-windows-vpn-application/#installing',
                    },
                },
            },
            {
                title: () => c('Download').t`macOS`,
                icon: 'brand-mac' as IconName,
                content: {
                    image: macosPreview,
                    downloadButton: {
                        title: () => c('Download').t`Download for macOS`,
                        links: [
                            {
                                title: () => c('Download').t`macOS Ventura or later`,
                                link: 'https://vpn.protondownload.com/download/macos/5.0.0/ProtonVPN_mac_v5.0.0.dmg',
                            },
                            {
                                title: () => c('Download').t`macOS Monterey`,
                                link: 'https://vpn.protondownload.com/download/macos/4.8.0/ProtonVPN_mac_v4.8.0.dmg',
                            },
                            {
                                title: () => c('Download').t`macOS Big Sur`,
                                link: 'https://vpn.protondownload.com/download/ProtonVPN_mac_v3.3.6.dmg',
                            },
                            {
                                title: () => c('Download').t`macOS Catalina`,
                                link: 'https://vpn.protondownload.com/download/ProtonVPN_mac_v3.0.22.dmg',
                            },
                            {
                                title: () => c('Download').t`macOS Mojave or earlier`,
                                link: 'https://vpn.protondownload.com/download/ProtonVPN_mac_v1.9.6.dmg',
                            },
                        ],
                    },
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://protonvpn.com/support/protonvpn-mac-vpn-application/',
                    },
                },
            },
            {
                title: () => c('Download').t`Linux`,
                icon: 'brand-linux' as IconName,
                content: {
                    image: linuxPreview,
                    downloadButton: {
                        title: () => c('Download').t`Download for Linux`,
                        link: 'https://protonvpn.com/download-linux',
                        style: 'external' as const,
                    },
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://protonvpn.com/support/linux-vpn-setup/',
                    },
                },
            },
        ],
    },
    {
        category: () => c('Download').t`Mobile`,
        tabs: [
            {
                title: () => c('Download').t`iPhone/iPad`,
                icon: 'brand-apple' as IconName,
                content: {
                    image: iOSPreview,
                    downloadButton: {
                        title: () => c('Download').t`Download on the Apple App Store`,
                        link: 'https://apps.apple.com/app/apple-store/id1437005085?pt=106513916&ct=protonvpn.com-dashboard&mt=8',
                        style: 'appstore' as const,
                        image: appleAppStoreImage,
                    },
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://protonvpn.com/support/protonvpn-ios-vpn-app/',
                    },
                },
            },
            {
                title: () => c('Download').t`Android`,
                icon: 'brand-android' as IconName,
                content: {
                    image: androidPreview,
                    downloadButton: {
                        title: () => c('Download').t`Download on the Google Play Store`,
                        link: 'https://play.google.com/store/apps/details?id=ch.protonvpn.android&utm_campaign=ww-all-2a-vpn-int_webapp-g_eng-apps_links_dashboard&utm_source=account.protonvpn.com&utm_medium=link&utm_content=dashboard&utm_term=android',
                        style: 'appstore' as const,
                        image: googlePlayStoreImage,
                    },
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://protonvpn.com/support/best-android-vpn-app/',
                    },
                },
            },
        ],
    },
    {
        category: () => c('Download').t`Browser`,
        tabs: [
            {
                title: () => c('Download').t`Chrome`,
                icon: 'brand-chrome' as IconName,
                content: {
                    image: chromePreview,
                    downloadButton: {
                        title: () => c('Download').t`Get the extension`,
                        link: 'https://chrome.google.com/webstore/detail/proton-vpn-a-swiss-vpn-yo/jplgfhpmjnbigmhklmmbgecoobifkmpa',
                        style: 'external' as const,
                    },
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://protonvpn.com/support/browser-extensions/#chrome',
                    },
                },
            },
            {
                title: () => c('Download').t`Firefox`,
                icon: 'brand-firefox' as IconName,
                content: {
                    image: firefoxPreview,
                    downloadButton: {
                        title: () => c('Download').t`Get the extension`,
                        link: 'https://addons.mozilla.org/firefox/addon/proton-vpn-firefox-extension/',
                        style: 'external' as const,
                    },
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://protonvpn.com/support/browser-extensions/#firefox',
                    },
                },
            },
        ],
    },
    {
        category: () => c('Download').t`TV`,
        tabs: [
            {
                title: () => c('Download').t`Apple TV`,
                icon: 'brand-apple' as IconName,
                content: {
                    image: appleTVPreview,
                    downloadButton: {
                        title: () => c('Download').t`Get the app`,
                        link: 'https://protonvpn.com/download-appletv',
                        style: 'external' as const,
                    },
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://protonvpn.com/support/apple-tv',
                    },
                },
            },
            {
                title: () => c('Download').t`Android TV`,
                icon: 'brand-android' as IconName,
                content: {
                    image: androidTVPreview,
                    downloadButton: {
                        title: () => c('Download').t`Get the app`,
                        link: 'https://protonvpn.com/download-androidtv',
                        style: 'external' as const,
                    },
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://protonvpn.com/support/android-tv/',
                    },
                },
            },
            {
                title: () => c('Download').t`Fire TV`,
                icon: 'brand-amazon' as IconName,
                content: {
                    image: firetvPreview,
                    downloadButton: {
                        title: () => c('Download').t`Get the app`,
                        link: 'https://protonvpn.com/support/firestick',
                        style: 'external' as const,
                    },
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://protonvpn.com/support/firestick',
                    },
                },
            },
        ],
    },
];

const CategoryTabs = ({ category }: { category: Category }) => {
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const subTabs = category.tabs.map((tab: CategoryTab) => ({
        title: tab.title(),
        icon: tab.icon,
        iconPosition: 'leading' as const,
        content: (
            <div key={tab.title()} className="pb-2 flex flex-column gap-6">
                {tab.content.image ? (
                    <figure
                        className="flex justify-center m-0 md:w-8/10 mx-auto max-w-custom"
                        style={{
                            aspectRatio: '1.778',
                            '--max-w-custom': '25rem',
                        }}
                    >
                        <img src={tab.content.image} alt={tab.title()} className="w-full h-auto" />
                    </figure>
                ) : undefined}
                <div>
                    {tab.content.downloadButton.links ? (
                        <>
                            <DropdownButton
                                fullWidth
                                color="norm"
                                className="justify-center"
                                ref={anchorRef}
                                isOpen={isOpen}
                                onClick={toggle}
                                hasCaret
                            >
                                {tab.content.downloadButton.title()}
                            </DropdownButton>
                            <Dropdown
                                isOpen={isOpen}
                                anchorRef={anchorRef}
                                onClose={close}
                                size={{ width: DropdownSizeUnit.Dynamic, maxWidth: DropdownSizeUnit.Viewport }}
                            >
                                <DropdownMenu>
                                    {tab.content.downloadButton.links.map((download: DownloadLink) => (
                                        <DropdownMenuLink
                                            href={download.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-left flex flex-nowrap items-center justify-space-between gap-2"
                                            key={download.title()}
                                        >
                                            <span>{download.title()}</span>
                                            <IcArrowDownLine className="ml-auto shrink-0" />
                                        </DropdownMenuLink>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        </>
                    ) : undefined}

                    {tab.content.downloadButton.link ? (
                        <ButtonLike
                            as="a"
                            color="norm"
                            fullWidth
                            className={clsx(
                                tab.content.downloadButton.style === 'appstore' && 'VpnDownloadSection-button-appstore',
                                tab.content.downloadButton.style === 'external' && 'VpnDownloadSection-button-external'
                            )}
                            href={tab.content.downloadButton.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={tab.content.downloadButton.title()}
                        >
                            {tab.content.downloadButton.image ? (
                                <img src={tab.content.downloadButton.image} alt={tab.content.downloadButton.title()} />
                            ) : (
                                tab.content.downloadButton.title()
                            )}

                            {tab.content.downloadButton.style === 'external' && (
                                <IcArrowOutSquare className="ml-1 shrink-0" />
                            )}
                        </ButtonLike>
                    ) : undefined}

                    {tab.content.footnote ? (
                        <footer className="mt-4 flex justify-center">
                            <ButtonLike
                                as="a"
                                color="norm"
                                shape="underline"
                                href={tab.content.footnote.link}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {tab.content.footnote.title()}
                                <IcArrowOutSquare className="ml-1 shrink-0" />
                            </ButtonLike>
                        </footer>
                    ) : undefined}
                </div>
            </div>
        ),
    }));

    return (
        <Tabs
            tabs={subTabs as Tab[]}
            variant="underline"
            fullWidth
            value={activeTabIndex}
            onChange={setActiveTabIndex}
        />
    );
};

const Download = () => {
    const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

    const categoryTabs = downloadData.map((category) => ({
        title: category.category(),
        content: <CategoryTabs category={category} />,
    }));

    return (
        <Tabs
            tabs={categoryTabs as Tab[]}
            variant="modern"
            fullWidth
            value={activeCategoryIndex}
            onChange={setActiveCategoryIndex}
        />
    );
};

export const VpnDownloadSection = ({ className }: { className?: string }) => {
    return (
        <DashboardCard className={className}>
            <DashboardCardContent>
                <Download />
            </DashboardCardContent>
        </DashboardCard>
    );
};

export default VpnDownloadSection;
