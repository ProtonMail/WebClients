import { c } from 'ttag';

import appleAppStoreImage from '@proton/components/containers/vpn/VpnDownloadSection/images/apple-app-store.svg';
import googlePlayStoreImage from '@proton/components/containers/vpn/VpnDownloadSection/images/google-play-store.svg';
import type { IconName } from '@proton/icons/types';

import DashboardDownloadSection from '../../../shared/DashboardDownloadSection/DashboardDownloadSection';
import androidPreview from './images/download-preview-android.png';
import bravePreview from './images/download-preview-brave.png';
import chromePreview from './images/download-preview-chrome.png';
import edgePreview from './images/download-preview-edge.png';
import firefoxPreview from './images/download-preview-firefox.png';
import iosPreview from './images/download-preview-ios.png';
import linuxPreview from './images/download-preview-linux.png';
import macosPreview from './images/download-preview-macos.png';
import safariPreview from './images/download-preview-safari.png';
import windowsPreview from './images/download-preview-windows.png';

const downloadData = [
    {
        title: () => c('Download').t`Browser`,
        tabs: [
            {
                title: () => c('Download').t`Chrome`,
                icon: 'brand-chrome' as IconName,
                content: {
                    image: chromePreview,
                    downloadButtons: [
                        {
                            title: () => c('Download').t`Download for Chrome`,
                            link: 'https://chrome.google.com/webstore/detail/proton-pass-free-password/ghmbeldphafepmbegfdlkpapadhbakde',
                        },
                    ],
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://proton.me/support/pass-setup#How-to-install-Proton-Pass-for-Chrome',
                    },
                },
            },
            {
                title: () => c('Download').t`Firefox`,
                icon: 'brand-firefox' as IconName,
                content: {
                    image: firefoxPreview,
                    downloadButtons: [
                        {
                            title: () => c('Download').t`Download for Firefox`,
                            link: 'https://addons.mozilla.org/en-US/firefox/addon/proton-pass/',
                        },
                    ],
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://proton.me/support/pass-setup#How-to-install-Proton-Pass-for-Firefox',
                    },
                },
            },
            {
                title: () => c('Download').t`Edge`,
                icon: 'brand-edge' as IconName,
                content: {
                    image: edgePreview,
                    downloadButtons: [
                        {
                            title: () => c('Download').t`Download for Edge`,
                            link: 'https://microsoftedge.microsoft.com/addons/detail/proton-pass-free-passwor/gcllgfdnfnllodcaambdaknbipemelie',
                        },
                    ],
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://proton.me/support/pass-setup#How-to-install-Proton-Pass-for-Chrome',
                    },
                },
            },
            {
                title: () => c('Download').t`Safari`,
                icon: 'brand-safari' as IconName,
                content: {
                    image: safariPreview,
                    downloadButtons: [
                        {
                            title: () => c('Download').t`Download for Safari`,
                            link: 'https://apps.apple.com/app/id6502835663',
                        },
                    ],
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://proton.me/support/pass-setup#Safari',
                    },
                },
            },
            {
                title: () => c('Download').t`Brave`,
                icon: 'brand-brave' as IconName,
                content: {
                    image: bravePreview,
                    downloadButtons: [
                        {
                            title: () => c('Download').t`Download for Brave`,
                            link: 'https://chrome.google.com/webstore/detail/proton-pass-free-password/ghmbeldphafepmbegfdlkpapadhbakde',
                        },
                    ],
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://proton.me/support/pass-setup#How-to-install-Proton-Pass-for-Chrome',
                    },
                },
            },
        ],
        enabled: true,
    },
    {
        title: () => c('Download').t`Mobile`,
        tabs: [
            {
                title: () => c('Download').t`iPhone/iPad`,
                icon: 'brand-apple' as IconName,
                content: {
                    image: iosPreview,
                    downloadButtons: [
                        {
                            title: () => c('Download').t`Download on the Apple App Store`,
                            link: 'https://apps.apple.com/app/apple-store/id6443490629',
                            style: 'appstore' as const,
                            image: appleAppStoreImage,
                        },
                    ],
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://proton.me/support/pass-setup-ios',
                    },
                },
            },
            {
                title: () => c('Download').t`Android`,
                icon: 'brand-android' as IconName,
                content: {
                    image: androidPreview,
                    downloadButtons: [
                        {
                            title: () => c('Download').t`Get it on Google Play`,
                            link: 'https://play.google.com/store/apps/details?id=proton.android.pass',
                            style: 'appstore' as const,
                            image: googlePlayStoreImage,
                        },
                    ],
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://proton.me/support/pass-setup-android',
                    },
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
                            link: 'https://proton.me/download/PassDesktop/win32/x64/ProtonPass_Setup.exe',
                        },
                    ],
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://proton.me/support/how-to-set-up-proton-pass-for-windows',
                    },
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
                            link: 'https://proton.me/download/PassDesktop/darwin/universal/ProtonPass.dmg',
                        },
                    ],
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://proton.me/support/set-up-proton-pass-macos',
                    },
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
                                    link: 'https://proton.me/download/PassDesktop/linux/x64/ProtonPass.deb',
                                },
                                {
                                    title: () => c('Download').t`.rpm (Fedora/RHEL)`,
                                    link: 'https://proton.me/download/PassDesktop/linux/x64/ProtonPass.rpm',
                                },
                            ],
                        },
                    ],
                    footnote: {
                        title: () => c('Download').t`Installation guide`,
                        link: 'https://proton.me/support/set-up-proton-pass-linux',
                    },
                },
            },
        ],
        enabled: true,
    },
];

const PassDownloadSection = () => {
    return <DashboardDownloadSection downloadConfig={downloadData} />;
};

export default PassDownloadSection;
