import { QRCode } from 'jsqr';

import ModalTwo from '@proton/components/components/modalTwo/Modal';

import QRCodeReader from '../QRCodeReader';

interface Props {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    onScan: (qrcode: QRCode) => void;
}

export const QRCodeReaderModal = ({ title, isOpen, onClose, onScan }: Props) => {
    return (
        <ModalTwo title={title} open={isOpen} onClose={onClose} enableCloseWhenClickOutside>
            <QRCodeReader onScan={onScan} />
        </ModalTwo>
    );
};
