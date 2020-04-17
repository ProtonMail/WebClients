import React, { ReactNode, createRef, useState, useEffect } from 'react';
import { c } from 'ttag';

import dragdropImageSvg from 'design-system/assets/img/pd-images/drag-and-drop.svg';

import { useDriveResource } from '../../Drive/DriveResourceProvider';
import useFiles from '../../../hooks/useFiles';

interface UploadDragDropProps {
    children: ReactNode;
    className?: string;
}

const UploadDragDrop = ({ children, className }: UploadDragDropProps) => {
    const dropAreaRef = createRef<HTMLDivElement>();
    const overlayRef = createRef<HTMLDivElement>();

    const { resource } = useDriveResource();
    const { uploadDriveFiles } = useFiles();
    const [overlayIsVisible, setOverlayIsVisible] = useState(false);

    const overlayEnabled = !!resource?.shareId;
    const dragOverEvents = ['dragenter', 'dragover'];
    const dragDropEvents = [...dragOverEvents, 'dragend', 'dragleave', 'drag', 'drop'];

    useEffect(() => {
        const handleDragOver = () => {
            setOverlayIsVisible(overlayEnabled);
        };

        dragOverEvents.forEach((eventName) => {
            dropAreaRef.current?.addEventListener(eventName, handleDragOver);
        });

        return () => {
            dragOverEvents.forEach((eventName) => {
                dropAreaRef.current?.removeEventListener(eventName, handleDragOver);
            });
        };
    }, [overlayEnabled]);

    useEffect(() => {
        const megabyteSize = 1048576;

        const preventDefault = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const handleDragLeave = () => {
            setOverlayIsVisible(false);
        };

        const isFile = async (blob: Blob): Promise<boolean> => {
            return new Promise((resolve) => {
                if (blob.size > megabyteSize) {
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

        const handleOnDrop = async (e: DragEvent) => {
            handleDragLeave();

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
        };

        dragDropEvents.forEach((eventName) => {
            overlayRef.current?.addEventListener(eventName, preventDefault);
        });

        overlayRef.current?.addEventListener('dragleave', handleDragLeave);
        overlayRef.current?.addEventListener('drop', handleOnDrop);

        return () => {
            dragDropEvents.forEach((eventName) => {
                overlayRef.current?.removeEventListener(eventName, preventDefault);
            });

            overlayRef.current?.removeEventListener('dragleave', handleDragLeave);
            overlayRef.current?.removeEventListener('drop', handleOnDrop);
        };
    }, [overlayIsVisible]);

    return (
        <div ref={dropAreaRef} className={className}>
            {children}
            {overlayEnabled && overlayIsVisible && (
                <div ref={overlayRef} className={'pd-drag-drop'}>
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
