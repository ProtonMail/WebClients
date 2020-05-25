import React, { ReactNode, useState, useCallback, SyntheticEvent } from 'react';
import { c, msgid } from 'ttag';

import dragdropImageSvg from 'design-system/assets/img/pd-images/drag-and-drop.svg';

import useFiles from '../../../hooks/useFiles';
import { useDriveActiveFolder } from '../../Drive/DriveFolderProvider';

interface UploadDragDropProps {
    children: ReactNode;
    disabled?: boolean;
    className?: string;
}

const UploadDragDrop = ({ children, className, disabled }: UploadDragDropProps) => {
    const { folder } = useDriveActiveFolder();
    const { uploadDriveFiles } = useFiles();
    const [overlayIsVisible, setOverlayIsVisible] = useState(false);
    const [fileCount, setFileCount] = useState(0);

    const overlayEnabled = !!folder?.shareId && !disabled;

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            if (!e.dataTransfer.types.includes('Files')) {
                return;
            }

            if (overlayIsVisible !== overlayEnabled) {
                setOverlayIsVisible(overlayEnabled);
            }

            const draggedFileCount = e.dataTransfer.items.length;

            if (fileCount !== draggedFileCount) {
                setFileCount(draggedFileCount);
            }
        },
        [overlayEnabled, overlayIsVisible, fileCount]
    );

    const handleDragLeave = useCallback(() => {
        setOverlayIsVisible(false);
    }, [overlayIsVisible]);

    const handleDrop = useCallback(
        async (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setOverlayIsVisible(false);
            const items = e.dataTransfer.items;

            if (!folder || !items) {
                return;
            }

            const filesToUpload: { path: string; file?: File }[] = [];

            const traverseDirectories = function(item: any, path: string) {
                if (item.isFile) {
                    item.file(
                        (file: File) => filesToUpload.push({ path, file }),
                        (error: Error) => console.error(`Unable to get File ${item}: ${error}`)
                    );
                } else if (item.isDirectory) {
                    const reader = item.createReader();

                    const getEntries = () => {
                        reader.readEntries(
                            (entries: any[]) => {
                                if (entries.length) {
                                    for (let i = 0; i < entries.length; i++) {
                                        traverseDirectories(entries[i], item.fullPath);
                                    }
                                    getEntries();
                                } else {
                                    filesToUpload.push({ path: item.fullPath });
                                }
                            },
                            (error: Error) => console.error(`Unable to traverse directory ${item}: ${error}`)
                        );
                    };

                    getEntries();
                }
            };

            for (let i = 0; i < items.length; i++) {
                const item = items[i].webkitGetAsEntry();

                if (!item) {
                    return;
                }

                traverseDirectories(item, '/');
            }

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
                        <p className="m0">
                            {c('Info').ngettext(
                                msgid`Your file will be encrypted and then saved.`,
                                `Your files will be encrypted and then saved.`,
                                fileCount
                            )}
                        </p>
                    </section>
                </div>
            )}
        </div>
    );
};

export default UploadDragDrop;
