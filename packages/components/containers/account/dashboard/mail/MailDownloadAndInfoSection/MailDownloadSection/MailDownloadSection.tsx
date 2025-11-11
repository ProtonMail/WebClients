import { c } from 'ttag';

import appleAppStoreImage from '@proton/components/containers/vpn/VpnDownloadSection/images/apple-app-store.svg';
import googlePlayStoreImage from '@proton/components/containers/vpn/VpnDownloadSection/images/google-play-store.svg';
import type { IconName } from '@proton/icons/types';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

import DashboardDownloadSection from '../../../shared/DashboardDownloadSection/DashboardDownloadSection';
import calendarMobilePreview from './images/download-preview-calendar.png';
import linuxPreview from './images/download-preview-linux.png';
import macosPreview from './images/download-preview-macos.png';
import mailMobilePreview from './images/download-preview-mail.png';
import windowsPreview from './images/download-preview-windows.png';

const downloadData = [
    {
        title: () => c('Download').t`Mobile`,
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
        title: () => c('Download').t`Desktop`,
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

const MailDownloadSection = () => {
    return <DashboardDownloadSection downloadConfig={downloadData} />;
};

export default MailDownloadSection;
