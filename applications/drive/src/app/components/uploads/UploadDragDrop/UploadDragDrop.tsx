import type { ReactNode, SyntheticEvent } from 'react';
import { useCallback, useState } from 'react';
import * as React from 'react';

import { c } from 'ttag';

import dragdropImageSvg from '@proton/styles/assets/img/illustrations/drag-and-drop.svg';

import { useFileDrop } from '../../../hooks/drive/useFileDrop';

interface UploadDragDropProps {
    children: ReactNode;
    shareId: string;
    linkId: string;
    className?: string;
    disabled?: boolean;
    isForPhotos?: boolean;
}

const UploadDragDrop = ({
    children,
    className,
    disabled,
    shareId,
    linkId,
    isForPhotos = false,
}: UploadDragDropProps) => {
    const { handleDrop } = useFileDrop({ isForPhotos, shareId, linkId });

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
