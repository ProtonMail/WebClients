import React, { ReactNode, useState, useCallback, SyntheticEvent } from 'react';
import { c } from 'ttag';

import dragdropImageSvg from 'design-system/assets/img/pd-images/drag-and-drop.svg';

import { useDriveResource } from '../../Drive/DriveResourceProvider';
import useFiles from '../../../hooks/useFiles';

const MEGABYTE_SIZE = 1048576;

const isFile = async (blob: File) => {
    return new Promise<boolean>((resolve) => {
        if (blob.size > MEGABYTE_SIZE) {
            resolve(true);
        }

        const reader = new FileReader();
        reader.onload = function() {
            resolve(true);
        };
        reader.onerror = function() {
            resolve(false);
        };
        reader.readAsArrayBuffer(blob);
    });
};

interface UploadDragDropProps {
    children: ReactNode;
    className?: string;
}

const UploadDragDrop = ({ children, className }: UploadDragDropProps) => {
    const { resource } = useDriveResource();
    const { uploadDriveFiles } = useFiles();
    const [overlayIsVisible, setOverlayIsVisible] = useState(false);

    const overlayEnabled = !!resource?.shareId;

    const handleDragOver = useCallback(() => {
        if (overlayIsVisible !== overlayEnabled) {
            setOverlayIsVisible(overlayEnabled);
        }
    }, [overlayEnabled]);

    const handleDragLeave = useCallback(() => {
        setOverlayIsVisible(false);
    }, [overlayIsVisible]);

    const handleDrop = useCallback(
        async (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setOverlayIsVisible(false);

            const files = e.dataTransfer?.files;
            if (!resource || !files) {
                return;
            }

            const filesToUpload = [];
            for (let i = 0; i < files.length; i++) {
                if (await isFile(files[i])) {
                    filesToUpload.push(files[i]);
                }
            }

            uploadDriveFiles(resource.shareId, resource.linkId, filesToUpload);
        },
        [overlayIsVisible]
    );

    const preventDefaultEvent = useCallback((e: SyntheticEvent) => e.preventDefault(), []);

    return (
        <div
            className={className}
            onDragEnter={handleDragOver}
            onDragOver={handleDragOver}
            onDrop={preventDefaultEvent}
        >
            {children}
            {overlayEnabled && overlayIsVisible && (
                <div
                    className="pd-drag-drop"
                    onDragLeave={handleDragLeave}
                    onDragOver={preventDefaultEvent}
                    onDrop={handleDrop}
                >
                    <section className="pd-drag-drop-infobox p2">
                        <img className="pd-drag-drop-image" src={dragdropImageSvg} alt="" aria-hidden="true" />
                        <h2 className="bold m0">{c('Title').t`Drop to upload`}</h2>
                        <p className="m0">{c('Info').t`Your file will be encrypted and then saved.`}</p>
                    </section>
                </div>
            )}
        </div>
    );
};

export default UploadDragDrop;
