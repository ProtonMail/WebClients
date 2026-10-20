import type { ReactNode, SyntheticEvent } from 'react';
import { useCallback } from 'react';

import { c } from 'ttag';

import dragdropImageSvg from '@proton/styles/assets/img/illustrations/drag-and-drop.svg';

import { useFileDrop } from '../../../../legacy/hooks/drive/useFileDrop';
import { useUploadDragDropOverlay } from '../../../../statelessComponents/UploadDragDrop/useUploadDragDropOverlay';

import './UploadDragDrop.scss';

interface UploadDragDropProps {
    children: ReactNode;
    shareId: string;
    parentLinkId: string;
    volumeId: string;
    className?: string;
    disabled?: boolean;
    isForPhotos?: boolean;
    onDrop?: () => void;
}

const UploadDragDrop = ({
    children,
    className,
    disabled,
    shareId,
    volumeId,
    parentLinkId,
    onDrop,
    isForPhotos = false,
}: UploadDragDropProps) => {
    const { handleDrop } = useFileDrop({
        isForPhotos,
        shareId,
        volumeId,
        parentLinkId,
    });

    const { isOverlayVisible, handleDragOver, handleDragLeave } = useUploadDragDropOverlay(!disabled);

    const preventDefaultEvent = useCallback((e: SyntheticEvent) => e.preventDefault(), []);

    return (
        <div
            className={className}
            onDragEnter={handleDragOver}
            onDragOver={handleDragOver}
            onDrop={preventDefaultEvent}
            data-testid="drag-and-drop-upload"
        >
            <img className="visibility-hidden absolute h-0 w-0" src={dragdropImageSvg} alt="" aria-hidden="true" />
            {children}
            {isOverlayVisible && (
                <div
                    className="upload-drag-drop"
                    onDragLeave={handleDragLeave}
                    onDragOver={preventDefaultEvent}
                    onDrop={(e) => {
                        if (e.dataTransfer) {
                            void handleDrop(e);
                        }
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
