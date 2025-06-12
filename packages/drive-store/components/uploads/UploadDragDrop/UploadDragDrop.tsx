import type { ReactNode, SyntheticEvent } from 'react';
import { useCallback, useState } from 'react';

import { c } from 'ttag';

import dragdropImageSvg from '@proton/styles/assets/img/illustrations/drag-and-drop.svg';

import { useFileDrop } from '../../../hooks/drive/useFileDrop';
import type {
    OnFileSkippedSuccessCallbackData,
    OnFileUploadSuccessCallbackData,
    OnFolderUploadSuccessCallbackData,
} from '../../../store';

import './UploadDragDrop.scss';

interface UploadDragDropProps {
    children: ReactNode;
    shareId: string;
    parentLinkId: string;
    className?: string;
    disabled?: boolean;
    isForPhotos?: boolean;
    onFileUpload?: (file: OnFileUploadSuccessCallbackData) => void;
    onFileSkipped?: (file: OnFileSkippedSuccessCallbackData) => void;
    onFolderUpload?: (folder: OnFolderUploadSuccessCallbackData) => void;
    onDrop?: () => void;
}

const UploadDragDrop = ({
    children,
    className,
    disabled,
    shareId,
    parentLinkId,
    onFileUpload,
    onFileSkipped,
    onFolderUpload,
    onDrop,
    isForPhotos = false,
}: UploadDragDropProps) => {
    const { handleDrop } = useFileDrop({
        isForPhotos,
        shareId,
        parentLinkId,
        onFileUpload,
        onFolderUpload,
        onFileSkipped,
    });

    const [overlayIsVisible, setOverlayIsVisible] = useState(false);

    const overlayEnabled = !disabled;

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            if (!e.dataTransfer.types.includes('Files')) {
                return;
            }

            if (overlayIsVisible !== overlayEnabled) {
                setOverlayIsVisible(overlayEnabled);
            }
        },
        [overlayEnabled, overlayIsVisible]
    );

    const handleDragLeave = () => {
        setOverlayIsVisible(false);
    };

    const preventDefaultEvent = useCallback((e: SyntheticEvent) => e.preventDefault(), []);

    return (
        <div
            className={className}
            onDragEnter={handleDragOver}
            onDragOver={handleDragOver}
            onDrop={preventDefaultEvent}
        >
            <img className="visibility-hidden absolute h-0 w-0" src={dragdropImageSvg} alt="" aria-hidden="true" />
            {children}
            {overlayEnabled && overlayIsVisible && (
                <div
                    className="upload-drag-drop"
                    onDragLeave={handleDragLeave}
                    onDragOver={preventDefaultEvent}
                    onDrop={(e) => {
                        setOverlayIsVisible(false);
                        void handleDrop(e);
                        void onDrop?.();
                    }}
                >
                    <section className="upload-drag-drop-infobox p-14 pt-11">
                        <img className="upload-drag-drop-image" src={dragdropImageSvg} alt="" aria-hidden="true" />
                        <h2 className="text-bold mt-4 mb-0">{c('Title').t`Drop to upload`}</h2>
                        <p className="mt-4 mb-0">{c('Info').t`Your files will be encrypted and then saved.`}</p>
                    </section>
                </div>
            )}
        </div>
    );
};

export default UploadDragDrop;
