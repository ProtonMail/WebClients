import { useState } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuLink from '@proton/components/components/dropdown/DropdownMenuLink';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import type { Tab } from '@proton/components/components/tabs/Tabs';
import { Tabs } from '@proton/components/components/tabs/Tabs';
import appleAppStoreImage from '@proton/components/containers/vpn/VpnDownloadSection/images/apple-app-store.svg';
import googlePlayStoreImage from '@proton/components/containers/vpn/VpnDownloadSection/images/google-play-store.svg';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import type { IconName } from '@proton/icons/types';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import clsx from '@proton/utils/clsx';

import calendarMobilePreview from './images/download-preview-calendar.png';
import linuxPreview from './images/download-preview-linux.png';
import macosPreview from './images/download-preview-macos.png';
import mailMobilePreview from './images/download-preview-mail.png';
import windowsPreview from './images/download-preview-windows.png';

import './MailDownloadSection.scss';

interface DownloadLink {
    title: () => string;
    link: string;
    external?: boolean;
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
    downloadButtons?: DownloadButton[];
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
        category: () => c('Download').t`Mobile`,
        tabs: [
            {
                title: () => c('Download').t`Mail`,
                icon: 'brand-proton-mail' as IconName,
                content: {
                    image: mailMobilePreview,
                    downloadButtons: [
                        {
                            title: () => c('Download').t`Download on the Apple App Store`,
                            link: 'https://apps.apple.com/app/apple-store/id979659905',
                            style: 'appstore' as const,
                            image: appleAppStoreImage,
                        },
                        {
                            title: () => c('Download').t`Get it on Google Play`,
                            link: 'https://play.google.com/store/apps/details?id=ch.protonmail.android',
                            style: 'appstore' as const,
                            image: googlePlayStoreImage,
                        },
                    ],
                },
            },
            {
                title: () => c('Download').t`Calendar`,
                icon: 'brand-proton-calendar' as IconName,
                content: {
                    image: calendarMobilePreview,
                    downloadButtons: [
                        {
                            title: () => c('Download').t`Download on the Google Play Store`,
                            link: 'https://apps.apple.com/app/apple-store/id1514709943',
                            style: 'appstore' as const,
                            image: appleAppStoreImage,
                        },
                        {
                            title: () => c('Download').t`Get it on Google Play`,
                            link: 'https://play.google.com/store/apps/details?id=me.proton.android.calendar',
                            style: 'appstore' as const,
                            image: googlePlayStoreImage,
                        },
                    ],
                },
            },
        ],
        enabled: true,
    },
    {
        category: () => c('Download').t`Desktop`,
        tabs: [
            {
                title: () => c('Download').t`Windows`,
                icon: 'brand-windows' as IconName,
                content: {
                    image: windowsPreview,
                    downloadButtons: [
                        {
                            title: () => c('Download').t`Download for Windows`,
                            link: 'https://proton.me/download/mail/windows/ProtonMail-desktop.exe',
                        },
                    ],
                },
            },
            {
                title: () => c('Download').t`macOS`,
                icon: 'brand-mac' as IconName,
                content: {
                    image: macosPreview,
                    downloadButtons: [
                        {
                            title: () => c('Download').t`Download for macOS`,
                            link: 'https://proton.me/download/mail/macos/ProtonMail-desktop.dmg',
                        },
                    ],
                },
            },
            {
                title: () => c('Download').t`Linux`,
                icon: 'brand-linux' as IconName,
                content: {
                    image: linuxPreview,
                    downloadButtons: [
                        {
                            title: () => c('Download').t`Download for Linux`,
                            links: [
                                {
                                    title: () => c('Download').t`.deb (Ubuntu/Debian)`,
                                    link: 'https://proton.me/download/mail/linux/ProtonMail-desktop-beta.deb',
                                },
                                {
                                    title: () => c('Download').t`.rpm (Fedora/RHEL)`,
                                    link: 'https://proton.me/download/mail/linux/ProtonMail-desktop-beta.rpm',
                                },
                                {
                                    title: () => c('Download').t`Download on Snap store`,
                                    link: 'https://snapcraft.io/proton-mail',
                                    external: true,
                                },
                            ],
                        },
                    ],
                },
            },
        ],
        enabled: !isElectronApp,
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
                <div className="flex gap-4 w-full">
                    {tab.content.downloadButtons?.map((downloadButton) => {
                        return (
                            <div className="flex-1" key={downloadButton.title()}>
                                {downloadButton.links ? (
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
                                            {downloadButton.title()}
                                        </DropdownButton>
                                        <Dropdown
                                            isOpen={isOpen}
                                            anchorRef={anchorRef}
                                            onClose={close}
                                            size={{
                                                width: DropdownSizeUnit.Dynamic,
                                                maxWidth: DropdownSizeUnit.Viewport,
                                            }}
                                        >
                                            <DropdownMenu>
                                                {downloadButton.links.map((download: DownloadLink) => (
                                                    <DropdownMenuLink
                                                        href={download.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-left flex flex-nowrap items-center justify-space-between gap-2"
                                                        key={download.title()}
                                                    >
                                                        <span>{download.title()}</span>
                                                        {download.external ? (
                                                            <IcArrowOutSquare className="ml-auto shrink-0" />
                                                        ) : (
                                                            <IcArrowDownLine className="ml-auto shrink-0" />
                                                        )}
                                                    </DropdownMenuLink>
                                                ))}
                                            </DropdownMenu>
                                        </Dropdown>
                                    </>
                                ) : undefined}

                                {downloadButton.link ? (
                                    <ButtonLike
                                        as="a"
                                        color="norm"
                                        fullWidth
                                        className={clsx(
                                            downloadButton.style === 'appstore' &&
                                                'MailDownloadSection-button-appstore',
                                            downloadButton.style === 'external' && 'MailDownloadSection-button-external'
                                        )}
                                        href={downloadButton.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={downloadButton.title()}
                                    >
                                        {downloadButton.image ? (
                                            <img src={downloadButton.image} alt={downloadButton.title()} />
                                        ) : (
                                            downloadButton.title()
                                        )}

                                        {downloadButton.style === 'external' && (
                                            <IcArrowOutSquare className="ml-1 shrink-0" />
                                        )}
                                    </ButtonLike>
                                ) : undefined}
                            </div>
                        );
                    })}
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

const MailDownloadSection = () => {
    const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

    const categoryTabs = downloadData
        .filter(({ enabled }) => enabled)
        .map((category) => ({
            title: category.category(),
            content: <CategoryTabs category={category} />,
        }));
    return (
        <DashboardCard>
            <DashboardCardContent>
                <Tabs
                    tabs={categoryTabs}
                    variant="modern"
                    fullWidth
                    value={activeCategoryIndex}
                    onChange={setActiveCategoryIndex}
                />
            </DashboardCardContent>
        </DashboardCard>
    );
};

export default MailDownloadSection;
