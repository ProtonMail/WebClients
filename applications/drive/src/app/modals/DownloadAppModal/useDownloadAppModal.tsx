import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import type { ModalStateProps } from '@proton/components';
import {
    ButtonGroup,
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    ModalTwo,
    ModalTwoContent,
    ModalTwoHeader,
    useActiveBreakpoint,
    usePopperAnchor,
} from '@proton/components';
import QRCode from '@proton/components/components/image/QRCode';
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';
import { DESKTOP_PLATFORMS, DRIVE_APP_NAME, DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { DRIVE_ANDROID_APP, DRIVE_IOS_APP } from '@proton/shared/lib/drive/urls';
import { isIos, isMac } from '@proton/shared/lib/helpers/browser';
import appStoreSvg from '@proton/styles/assets/img/illustrations/app-store.svg';
import playStoreSvg from '@proton/styles/assets/img/illustrations/play-store.svg';
import macLaptop from '@proton/styles/assets/img/onboarding/drive-download-preview-macos.webp';
import windowsLaptop from '@proton/styles/assets/img/onboarding/drive-download-preview-windows.webp';
import noop from '@proton/utils/noop';

import { useDesktopDownloads } from '../../hooks/drive/useDesktopDownloads';
import androidLogo from './android.webp';
import iosLogo from './ios.webp';

function DownloadAppModal({ ...modalProps }: ModalStateProps) {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const { isLoading, hasError, downloads } = useDesktopDownloads();
    const downloadFunctions = getDownloadFunctions(downloads);
    // Fetched the data, but at least one platform is not available
    const missingDownloadFunctions = downloads.length > 0 && Object.values(downloadFunctions).some((item) => !item);

    return (
        <ModalTwo {...modalProps} size="large">
            <ModalTwoHeader title={c('Title').t`Get mobile and desktop apps`} />

            <ModalTwoContent className="flex my-8">
                {/* Mobile download */}
                <div className="flex flex-column gap-8 items-center w-1/2">
                    <QRCode value="https://proton.me/driveapp" size={112} />

                    <div className="text-center color-weak">
                        <span className="text-bold">{c('Info').t`iOS and Android Apps`}</span>
                        <br />
                        <span>{c('Info').t`Scan to download`}</span>
                    </div>
                </div>

                {/* Desktop download */}
                <div className="flex flex-column gap-8 items-center w-1/2">
                    <img src={isMac() ? macLaptop : windowsLaptop} alt="Laptop" height="7rem" />

                    {hasError || missingDownloadFunctions ? (
                        <span className="text-center">{c('Error')
                            .t`Downloads of desktop apps are currently unavailable`}</span>
                    ) : (
                        <>
                            <ButtonGroup color="norm" shape="solid">
                                <Button
                                    ref={anchorRef}
                                    loading={isLoading}
                                    onClick={isMac() ? downloadFunctions.mac : downloadFunctions.windows}
                                >
                                    {isMac() ? c('Action').t`Download for Mac` : c('Action').t`Download for Windows`}
                                </Button>
                                <DropdownButton
                                    isOpen={isOpen}
                                    onClick={isLoading ? noop : toggle}
                                    color="norm"
                                    hasCaret
                                ></DropdownButton>
                            </ButtonGroup>
                            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} size={{ width: '11rem' }}>
                                <DropdownMenu>
                                    {isMac() ? (
                                        <MacDownloads downloadFunctions={downloadFunctions} />
                                    ) : (
                                        <WindowsDownloads downloadFunctions={downloadFunctions} />
                                    )}
                                </DropdownMenu>
                            </Dropdown>
                        </>
                    )}
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
}

export function useDownloadAppModal() {
    const { viewportWidth } = useActiveBreakpoint();
    const isMobile = viewportWidth['<=small'];
    return useModalTwoStatic(isMobile ? DownloadMobileAppModal : DownloadAppModal);
}

interface DownloadFunctions {
    windows: (() => void) | undefined;
    windowsARM: (() => void) | undefined;
    mac: (() => void) | undefined;
}

function getDownloadFunctions(downloads: { platform: string; startDownload?: () => void }[]): DownloadFunctions {
    return {
        windows: downloads.find((download) => download.platform === DESKTOP_PLATFORMS.WINDOWS_X64)?.startDownload,
        windowsARM: downloads.find((download) => download.platform === DESKTOP_PLATFORMS.WINDOWS_ARM)?.startDownload,
        mac: downloads.find((download) => download.platform === DESKTOP_PLATFORMS.MACOS)?.startDownload,
    };
}

function WindowsDownloads({ downloadFunctions }: { downloadFunctions: DownloadFunctions }) {
    return (
        <>
            <DropdownMenuButton onClick={downloadFunctions.windows}>{c('Action')
                .t`Windows 11/10 (x64)`}</DropdownMenuButton>
            <DropdownMenuButton onClick={downloadFunctions.windowsARM}>{c('Action')
                .t`Windows 11 (ARM64)`}</DropdownMenuButton>
            <DropdownMenuButton onClick={downloadFunctions.mac}>{c('Action').t`Download for MacOS`}</DropdownMenuButton>
        </>
    );
}

function MacDownloads({ downloadFunctions }: { downloadFunctions: DownloadFunctions }) {
    return (
        <>
            <DropdownMenuButton onClick={downloadFunctions.mac}>{c('Action').t`Download for MacOS`}</DropdownMenuButton>
            <DropdownMenuButton onClick={downloadFunctions.windows}>{c('Action')
                .t`Windows 11/10 (x64)`}</DropdownMenuButton>
            <DropdownMenuButton onClick={downloadFunctions.windowsARM}>{c('Action')
                .t`Windows 11 (ARM64)`}</DropdownMenuButton>
        </>
    );
}

function DownloadMobileAppModal({ ...modalProps }: ModalStateProps) {
    return (
        <ModalTwo {...modalProps} size="large">
            <ModalTwoHeader />

            <ModalTwoContent className="flex flex-column items-center">
                <img src={isIos() ? iosLogo : androidLogo} className="mb-5" alt={isIos() ? 'iOS' : 'Android'} />

                <h3 className="text-bold">{c('Title').t`Get ${DRIVE_SHORT_APP_NAME} on your phone`}</h3>

                <p>{c('Info').t`Better in the app`}</p>

                {isIos() ? (
                    <Href href={DRIVE_IOS_APP}>
                        <img width="140" src={appStoreSvg} alt={c('Info').t`${DRIVE_APP_NAME} on App Store`} />
                    </Href>
                ) : (
                    <Href href={DRIVE_ANDROID_APP}>
                        <img width="140" src={playStoreSvg} alt={c('Info').t`${DRIVE_APP_NAME} on Play Store`} />
                    </Href>
                )}
            </ModalTwoContent>
        </ModalTwo>
    );
}
