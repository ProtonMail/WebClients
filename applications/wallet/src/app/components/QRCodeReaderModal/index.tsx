import type { QRCode } from 'jsqr';

import type { ModalOwnProps } from '@proton/components';

import { Modal } from '../../atoms';
import QRCodeReader from '../QRCodeReader';

interface Props extends ModalOwnProps {
    title?: string;
    onScan: (qrcode: QRCode) => void;
    onError?: (errorName: DOMException['name']) => void;
}

export const QRCodeReaderModal = ({ title, onScan, onError, ...modalProps }: Props) => {
    return (
        <Modal title={title} {...modalProps} enableCloseWhenClickOutside>
            <QRCodeReader
                onScan={onScan}
                onError={(name) => {
                    onError?.(name);
                    modalProps.onClose?.();
                }}
            />
        </Modal>
    );
};
