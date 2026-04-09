import { c } from 'ttag';

import appleAppStoreImage from '@proton/components/containers/vpn/VpnDownloadSection/images/apple-app-store.svg';
import googlePlayStoreImage from '@proton/components/containers/vpn/VpnDownloadSection/images/google-play-store.svg';
import type { IconName } from '@proton/icons/types';
import { APPS } from '@proton/shared/lib/constants';

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
                    icon: 'brand-apple' as IconName,
                    content: {
                        image: iosPreview,
                        hint: () => c('Download').t`Scan the QR code with your mobile device`,
                        downloadButtons: [
                            {
                                title: () => c('Download').t`Download on the Apple App Store`,
                                link: 'https://apps.apple.com/app/id6745089447',
                                style: 'appstore' as const,
                                image: appleAppStoreImage,
                            },
                        ],
                    },
                },
                {
                    title: () => c('Download').t`Android`,
                    icon: 'brand-android' as IconName,
                    content: {
                        image: androidPreview,
                        hint: () => c('Download').t`Scan the QR code with your mobile device`,
                        downloadButtons: [
                            {
                                title: () => c('Download').t`Get it on Google Play`,
                                link: 'https://play.google.com/store/apps/details?id=proton.android.meet',
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
                    icon: 'brand-mac' as IconName,
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
                    icon: 'brand-linux' as IconName,
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

    return <DashboardDownloadSection downloadConfig={downloadData} />;
};

export default MeetDownloadSection;
