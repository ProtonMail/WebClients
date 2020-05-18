import React, { ReactNode, useState, useCallback, SyntheticEvent } from 'react';
import { MB } from '../../../constants';
import { c } from 'ttag';

import dragdropImageSvg from 'design-system/assets/img/pd-images/drag-and-drop.svg';

import useFiles from '../../../hooks/useFiles';
import { useDriveActiveFolder } from '../../Drive/DriveFolderProvider';

const isFile = async (blob: File) => {
    return new Promise<boolean>((resolve) => {
        if (blob.size > MB) {
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
    disabled?: boolean;
    className?: string;
}

const UploadDragDrop = ({ children, className, disabled }: UploadDragDropProps) => {
    const { folder } = useDriveActiveFolder();
    const { uploadDriveFiles } = useFiles();
    const [overlayIsVisible, setOverlayIsVisible] = useState(false);

    const overlayEnabled = !!folder?.shareId && !disabled;

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

            const filesList = e.dataTransfer?.files;
            if (!folder || !filesList) {
                return;
            }

            const actualFiles: Promise<boolean>[] = [];
            for (let i = 0; i < filesList.length; i++) {
                actualFiles.push(isFile(filesList[i]));
            }

            const filesToUpload = (await Promise.allSettled(actualFiles)).reduce(
                (files, result, i) =>
                    result.status === 'fulfilled' && result.value ? [...files, filesList[i]] : files,
                [] as File[]
            );

            uploadDriveFiles(folder.shareId, folder.linkId, filesToUpload);
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
