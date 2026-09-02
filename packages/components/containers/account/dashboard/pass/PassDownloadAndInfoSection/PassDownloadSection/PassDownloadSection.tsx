import { c } from 'ttag';

import { IcBrandAndroid } from '@proton/icons/icons/IcBrandAndroid';
import { IcBrandApple } from '@proton/icons/icons/IcBrandApple';
import { IcBrandBrave } from '@proton/icons/icons/IcBrandBrave';
import { IcBrandChrome } from '@proton/icons/icons/IcBrandChrome';
import { IcBrandEdge } from '@proton/icons/icons/IcBrandEdge';
import { IcBrandFirefox } from '@proton/icons/icons/IcBrandFirefox';
import { IcBrandLinux } from '@proton/icons/icons/IcBrandLinux';
import { IcBrandMac } from '@proton/icons/icons/IcBrandMac';
import { IcBrandSafari } from '@proton/icons/icons/IcBrandSafari';
import { IcBrandWindows } from '@proton/icons/icons/IcBrandWindows';
import { APPS } from '@proton/shared/lib/constants';
import appleAppStoreImage from '@proton/styles/assets/img/vpn/download-section/apple-app-store.svg';
import googlePlayStoreImage from '@proton/styles/assets/img/vpn/download-section/google-play-store.svg';

import DashboardDownloadSection from '../../../shared/DashboardDownloadSection/DashboardDownloadSection';
import bravePreview from './images/download-preview-brave.png';
import chromePreview from './images/download-preview-chrome.png';
import edgePreview from './images/download-preview-edge.png';
import firefoxPreview from './images/download-preview-firefox.png';
import linuxPreview from './images/download-preview-linux.png';
import macosPreview from './images/download-preview-macos.png';
import mobilePreview from './images/download-preview-mobile.png';
import safariPreview from './images/download-preview-safari.png';
import windowsPreview from './images/download-preview-windows.png';

const downloadData = [
    {
        title: () => c('Download').t`Browser`,
        tabs: [
            {
                title: () => c('Download').t`Chrome`,
                icon: <IcBrandChrome />,
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
                icon: <IcBrandFirefox />,
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
                icon: <IcBrandEdge />,
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
                icon: <IcBrandSafari />,
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
                icon: <IcBrandBrave />,
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
                icon: <IcBrandApple />,
                content: {
                    image: mobilePreview,
                    downloadButtons: [
                        {
                            title: () => c('Download').t`Download on the Apple App Store`,
                            link: 'https://apps.apple.com/app/apple-store/id6443490629?pt=106513916&ct=wa_set_btn&mt=8',
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
                icon: <IcBrandAndroid />,
                content: {
                    image: mobilePreview,
                    downloadButtons: [
                        {
                            title: () => c('Download').t`Get it on Google Play`,
                            link: 'https://play.google.com/store/apps/details?id=proton.android.pass&referrer=utm_source\%3Dproton.me\%26utm_medium\%3Dweb\%26utm_campaign\%3Dwa_set_btn',
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
                icon: <IcBrandWindows />,
                content: {
                    image: windowsPreview,
                    downloadButtons: [
                        {
                            title: () => c('Download').t`Download for Windows`,
                            link: 'https://proton.me/download/pass/windows/ProtonPass.msix',
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
                icon: <IcBrandMac />,
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
                icon: <IcBrandLinux />,
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
    return <DashboardDownloadSection downloadConfig={downloadData} app={APPS.PROTONPASS} />;
};

export default PassDownloadSection;
