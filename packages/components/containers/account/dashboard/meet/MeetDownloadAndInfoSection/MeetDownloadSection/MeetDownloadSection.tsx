import { c } from 'ttag';

import { IcBrandAndroid } from '@proton/icons/icons/IcBrandAndroid';
import { IcBrandApple } from '@proton/icons/icons/IcBrandApple';
import { IcBrandLinux } from '@proton/icons/icons/IcBrandLinux';
import { IcBrandMac } from '@proton/icons/icons/IcBrandMac';
import { IcBrandWindows } from '@proton/icons/icons/IcBrandWindows';
import { APPS } from '@proton/shared/lib/constants';
import appleAppStoreImage from '@proton/styles/assets/img/vpn/download-section/apple-app-store.svg';
import googlePlayStoreImage from '@proton/styles/assets/img/vpn/download-section/google-play-store.svg';

import DashboardDownloadSection from '../../../shared/DashboardDownloadSection/DashboardDownloadSection';
import {
    LINUX_DISTRIBUTION,
    useDownloadLinuxDesktopAppURL,
} from '../../../shared/DashboardDownloadSection/useDownloadDesktopAppURL';
import androidPreview from './images/download-preview-android.png';
import iosPreview from './images/download-preview-ios.png';
import linuxPreview from './images/download-preview-linux.png';
import macosPreview from './images/download-preview-macos.png';
import windowsPreview from './images/download-preview-windows.png';

const MeetDownloadSection = () => {
    const macOsDownloadUrl = 'https://proton.me/download/meet/macos/ProtonMeet-desktop.dmg';
    const windowsDownloadUrl = 'https://proton.me/download/meet/windows/ProtonMeet-desktop.exe';
    const ubuntuDownloadUrl = useDownloadLinuxDesktopAppURL(APPS.PROTONMEET, LINUX_DISTRIBUTION.UBUNTU);
    const fedoraDownloadUrl = useDownloadLinuxDesktopAppURL(APPS.PROTONMEET, LINUX_DISTRIBUTION.FEDORA);

    const downloadData = [
        {
            title: () => c('Download').t`Mobile`,
            tabs: [
                {
                    title: () => c('Download').t`iOS`,
                    icon: <IcBrandApple />,
                    content: {
                        image: iosPreview,
                        hint: () => c('Download').t`Scan the QR code with your mobile device`,
                        downloadButtons: [
                            {
                                title: () => c('Download').t`Download on the Apple App Store`,
                                link: 'https://apps.apple.com/app/apple-store/id6745089447?pt=106513916&ct=wa_set_btn&mt=8',
                                style: 'appstore' as const,
                                image: appleAppStoreImage,
                            },
                        ],
                    },
                },
                {
                    title: () => c('Download').t`Android`,
                    icon: <IcBrandAndroid />,
                    content: {
                        image: androidPreview,
                        hint: () => c('Download').t`Scan the QR code with your mobile device`,
                        downloadButtons: [
                            {
                                title: () => c('Download').t`Get it on Google Play`,
                                link: 'https://play.google.com/store/apps/details?id=proton.android.meet&referrer=utm_source\%3Dproton.me\%26utm_medium\%3Dweb\%26utm_campaign\%3Dwa_set_btn',
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
                    icon: <IcBrandWindows />,
                    content: {
                        image: windowsPreview,
                        downloadButtons: [
                            {
                                title: () => c('Download').t`Download for Windows`,
                                link: windowsDownloadUrl,
                            },
                        ],
                        footnote: {
                            title: () => c('Download').t`Installation guide`,
                            link: 'https://proton.me/support/proton-meet-windows-app',
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
                                link: macOsDownloadUrl,
                            },
                        ],
                        footnote: {
                            title: () => c('Download').t`Installation guide`,
                            link: 'https://proton.me/support/drive-meet-guide',
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
                                        title: () => c('Download').t`Ubuntu/Debian`,
                                        link: ubuntuDownloadUrl,
                                    },
                                    {
                                        title: () => c('Download').t`Fedora`,
                                        link: fedoraDownloadUrl,
                                    },
                                ],
                            },
                        ],
                        footnote: {
                            title: () => c('Download').t`Installation guide`,
                            link: 'https://proton.me/support/proton-drive-windows-app',
                        },
                    },
                },
            ],
            enabled: true,
        },
    ];

    return <DashboardDownloadSection downloadConfig={downloadData} app={APPS.PROTONMEET} />;
};

export default MeetDownloadSection;
