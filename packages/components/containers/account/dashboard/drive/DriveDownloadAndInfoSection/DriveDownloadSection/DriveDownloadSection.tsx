import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import appleAppStoreImage from '@proton/components/containers/vpn/VpnDownloadSection/images/apple-app-store.svg';
import googlePlayStoreImage from '@proton/components/containers/vpn/VpnDownloadSection/images/google-play-store.svg';
import type { IconName } from '@proton/icons/types';
import { APPS, DESKTOP_PLATFORMS } from '@proton/shared/lib/constants';
import macosPreview from '@proton/styles/assets/img/onboarding/drive-download-preview-macos.png';
import windowsPreview from '@proton/styles/assets/img/onboarding/drive-download-preview-windows.png';

import DashboardDownloadSection from '../../../shared/DashboardDownloadSection/DashboardDownloadSection';
import useDownloadDesktopAppURL from '../../../shared/DashboardDownloadSection/useDownloadDesktopAppURL';
import androidPreview from './images/download-preview-android.png';
import iosPreview from './images/download-preview-ios.png';

const DriveDownloadSection = () => {
    const macOsDownloadUrl = useDownloadDesktopAppURL(APPS.PROTONDRIVE, DESKTOP_PLATFORMS.MACOS);
    const windowsX64DownloadUrl = useDownloadDesktopAppURL(APPS.PROTONDRIVE, DESKTOP_PLATFORMS.WINDOWS_X64);
    const windowsARMDownloadUrl = useDownloadDesktopAppURL(APPS.PROTONDRIVE, DESKTOP_PLATFORMS.WINDOWS_ARM);

    const downloadData = [
        {
            title: () => c('Download').t`Mobile`,
            tabs: [
                {
                    title: () => c('Download').t`iPhone/iPad`,
                    icon: 'brand-apple' as IconName,
                    content: {
                        image: iosPreview,
                        hint: () => c('Download').t`Scan the QR code with your mobile device`,
                        downloadButtons: [
                            {
                                title: () => c('Download').t`Download on the Apple App Store`,
                                link: 'https://apps.apple.com/app/id1509667851',
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
                        hint: () => {
                            const downloadButton = (
                                <ButtonLike
                                    as="a"
                                    size="small"
                                    shape="underline"
                                    color="norm"
                                    key={'download-apk-button'}
                                    href={'https://proton.me/download/DriveAndroid/ProtonDrive-Android.apk'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {c('Download').t`download the app (APK)`}
                                </ButtonLike>
                            );
                            // translator : Scan the QR code with your mobile device. You can also download the app (APK) directly.
                            return c('Download')
                                .jt`Scan the QR code with your mobile device. You can also ${downloadButton} directly.`;
                        },
                        downloadButtons: [
                            {
                                title: () => c('Download').t`Get it on Google Play`,
                                link: 'https://play.google.com/store/apps/details?id=me.proton.android.drive',
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
                                links: [
                                    {
                                        title: () => c('Download').t`Windows 10/11 (x64)`,
                                        link: windowsX64DownloadUrl,
                                    },
                                    {
                                        title: () => c('Download').t`Windows 10/11 (ARM64)`,
                                        link: windowsARMDownloadUrl,
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
                            link: 'https://proton.me/support/drive-macos-guide',
                        },
                    },
                },
            ],
            enabled: true,
        },
    ];

    return <DashboardDownloadSection downloadConfig={downloadData} />;
};

export default DriveDownloadSection;
