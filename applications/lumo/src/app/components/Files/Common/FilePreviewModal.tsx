import type { ModalStateProps } from '@proton/components';
import { ModalTwo } from '@proton/components';

import type { Attachment } from '../../../types';
import { FilePreviewPanel } from './FilePreviewPanel';

import './FilePreviewModal.scss';

interface FilePreviewModalProps extends ModalStateProps {
    attachment: Attachment;
}

export const FilePreviewModal = ({ attachment, ...modalProps }: FilePreviewModalProps) => {
    const handleClose = () => modalProps.onClose?.();

    return (
        <ModalTwo {...modalProps} size="large" className="file-preview-modal">
            <FilePreviewPanel attachment={attachment} onBack={handleClose} onClose={handleClose} />
        </ModalTwo>
    );
};
