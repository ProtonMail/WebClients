import { QRCode } from 'jsqr';

import { ModalOwnProps } from '@proton/components/components';

import { Modal } from '../../atoms';
import QRCodeReader from '../QRCodeReader';

interface Props extends ModalOwnProps {
    title?: string;
    onScan: (qrcode: QRCode) => void;
}

export const QRCodeReaderModal = ({ title, onScan, ...rest }: Props) => {
    return (
        <Modal title={title} {...rest} enableCloseWhenClickOutside>
            <QRCodeReader onScan={onScan} />
        </Modal>
    );
};
