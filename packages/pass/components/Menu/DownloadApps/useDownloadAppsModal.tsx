import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { ButtonGroup } from '@proton/components/components/button/ButtonGroup';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { clients } from '../../../clients';
import { Clients, PASS_APP_QR_URL } from '../../../constants';
import { usePassCore } from '../../Core/PassCoreProvider';
import { getDefaultDesktopClient } from './getDefaultDesktopClient';
import passDownloadLaptop from './pass-download-laptop.png';
import passDownloadQr from './pass-download-qr.png';

import './DownloadAppsModal.scss';

const DESKTOP_CLIENTS = [Clients.macOS, Clients.Windows, Clients.Linux] as const;

const getDesktopDownloadLabel = (client: Clients) => {
    switch (client) {
        case Clients.macOS:
            return c('Action').t`Download for macOS`;
        case Clients.Windows:
            return c('Action').t`Download for Windows`;
        case Clients.Linux:
            return c('Action').t`Download for Linux`;
        default:
            return c('Action').t`Download for Windows`;
    }
};

const getDesktopDropdownLabel = (client: Clients) => {
    switch (client) {
        case Clients.macOS:
            return c('Label').t`macOS`;
        case Clients.Windows:
            return c('Label').t`Windows`;
        case Clients.Linux:
            return c('Label').t`Linux`;
        default:
            return c('Label').t`Windows`;
    }
};

const getDesktopDropdownItems = (defaultClient: Clients) => {
    const otherClients = DESKTOP_CLIENTS.filter((client) => client !== defaultClient);

    return [defaultClient, ...otherClients];
};

function DownloadAppsModal({ ...modalProps }: ModalStateProps) {
    const { onLink } = usePassCore();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const defaultClient = getDefaultDesktopClient();

    const handleDownload = (client: Clients) => {
        onLink(clients[client].link);
    };

    return (
        <ModalTwo {...modalProps} size="large">
            <ModalTwoHeader
                title={DESKTOP_BUILD ? c('Title').t`Get mobile apps` : c('Title').t`Get mobile and desktop apps`}
            />

            <ModalTwoContent className="pass-download-apps-modal-content flex my-8">
                <div className="flex flex-column gap-8 items-center flex-1">
                    <Href href={PASS_APP_QR_URL}>
                        <img
                            className="pass-download-apps-qr"
                            src={passDownloadQr}
                            alt={c('Info').t`Scan to download ${PASS_APP_NAME} for iOS and Android`}
                            width={216}
                            height={216}
                        />
                    </Href>

                    <div className="pass-download-apps-mobile-copy flex flex-column items-center text-center">
                        <span className="pass-download-apps-mobile-title">{c('Info').t`iOS and Android Apps`}</span>
                        <span className="pass-download-apps-mobile-subtitle">{c('Info').t`Scan to download`}</span>
                    </div>
                </div>

                {!DESKTOP_BUILD && (
                    <>
                        <div className="pass-download-apps-modal-divider" aria-hidden="true" />

                        <div className="flex flex-column gap-8 items-center flex-1">
                            <img
                                className="pass-download-apps-laptop"
                                src={passDownloadLaptop}
                                alt=""
                                width={405}
                                height={234}
                            />

                            <ButtonGroup
                                className="pass-download-apps-button-group"
                                color="norm"
                                shape="solid"
                                separators={false}
                            >
                                <Button
                                    className="pass-download-apps-button-label"
                                    title={getDesktopDownloadLabel(defaultClient)}
                                    onClick={() => handleDownload(defaultClient)}
                                >
                                    <span className="pass-download-apps-button-label-text text-ellipsis">
                                        {getDesktopDownloadLabel(defaultClient)}
                                    </span>
                                </Button>
                                <DropdownButton
                                    ref={anchorRef}
                                    className="pass-download-apps-button-dropdown"
                                    isOpen={isOpen}
                                    onClick={toggle}
                                    color="norm"
                                    title={c('Action').t`Open platform selection dropdown`}
                                    hasCaret
                                />
                            </ButtonGroup>

                            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} size={{ width: '11rem' }}>
                                <DropdownMenu>
                                    {getDesktopDropdownItems(defaultClient).map((client) => (
                                        <DropdownMenuButton key={client} onClick={() => handleDownload(client)}>
                                            {getDesktopDropdownLabel(client)}
                                        </DropdownMenuButton>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </>
                )}
            </ModalTwoContent>
        </ModalTwo>
    );
}

export function useDownloadAppsModal() {
    return useModalTwoStatic(DownloadAppsModal);
}
