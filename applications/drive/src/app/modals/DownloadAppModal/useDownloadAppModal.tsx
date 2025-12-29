import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
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
import { DESKTOP_PLATFORMS } from '@proton/shared/lib/constants';
import { isMac } from '@proton/shared/lib/helpers/browser';
import macLaptop from '@proton/styles/assets/img/onboarding/drive-download-preview-macos.webp';
import windowsLaptop from '@proton/styles/assets/img/onboarding/drive-download-preview-windows.webp';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { useDesktopDownloads } from '../../hooks/drive/useDesktopDownloads';

function DownloadAppModal({ ...modalProps }: ModalStateProps) {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const { viewportWidth } = useActiveBreakpoint();
    const isMobile = viewportWidth['<=small'];

    const { isLoading, hasError, downloads } = useDesktopDownloads();
    const downloadFunctions = getDownloadFunctions(downloads);
    // Fetched the data, but at leas one platform is not available
    const missingDownloadFunctions = downloads.length > 0 && Object.values(downloadFunctions).some((item) => !item);

    return (
        <ModalTwo {...modalProps} size="large">
            <ModalTwoHeader
                title={isMobile ? c('Title').t`Get mobile app` : c('Title').t`Get mobile and desktop apps`}
            />

            <ModalTwoContent className={clsx('my-8', !isMobile && 'flex')}>
                {/* Mobile download */}
                <div className={clsx('flex flex-column gap-8 items-center', !isMobile && 'w-1/2')}>
                    <QRCode value="https://proton.me/driveapp" size={112} />

                    <div className="text-center color-weak">
                        <span className="text-bold">{c('Info').t`iOS and Android Apps`}</span>
                        <br />
                        <span>{c('Info').t`Scan to download`}</span>
                    </div>
                </div>

                {/* Desktop download */}
                {isMobile ? null : (
                    <div className="flex flex-column gap-8 items-center w-1/2">
                        <img src={isMac() ? macLaptop : windowsLaptop} alt="Laptop" style={{ height: '7rem' }} />

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
                                        {isMac()
                                            ? c('Action').t`Download for Mac`
                                            : c('Action').t`Download for Windows`}
                                    </Button>
                                    <DropdownButton
                                        isOpen={isOpen}
                                        onClick={isLoading ? noop : toggle}
                                        color="norm"
                                        hasCaret
                                    ></DropdownButton>
                                </ButtonGroup>
                                <Dropdown
                                    isOpen={isOpen}
                                    anchorRef={anchorRef}
                                    onClose={close}
                                    size={{ width: '11rem' }}
                                >
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
                )}
            </ModalTwoContent>
        </ModalTwo>
    );
}

export function useDownloadAppModal() {
    return useModalTwoStatic(DownloadAppModal);
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
