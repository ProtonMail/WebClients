import React, { ReactNode, createRef, useState, useEffect } from 'react';
import { c } from 'ttag';

import dragdropImageSvg from 'design-system/assets/img/pd-images/drag-and-drop.svg';

import { useDriveResource } from '../../Drive/DriveResourceProvider';
import useFiles from '../../../hooks/useFiles';

interface UploadDragDropProps {
    children: ReactNode;
}

const UploadDragDrop = ({ children }: UploadDragDropProps) => {
    const dropAreaRef = createRef<HTMLDivElement>();
    const overlayRef = createRef<HTMLDivElement>();

    const { resource } = useDriveResource();
    const { uploadDriveFile } = useFiles(resource?.shareId ?? '');
    const [overlayIsVisible, setOverlayIsVisible] = useState(false);

    const dragOverEvents = ['dragenter', 'dragover'];
    const dragDropEvents = [...dragOverEvents, 'dragend', 'dragleave', 'drag', 'drop'];

    useEffect(() => {
        const handleDragOver = () => {
            setOverlayIsVisible(true);
        };

        dragOverEvents.forEach((eventName) => {
            dropAreaRef.current?.addEventListener(eventName, handleDragOver);
        });

        return () => {
            dragOverEvents.forEach((eventName) => {
                dropAreaRef.current?.removeEventListener(eventName, handleDragOver);
            });
        };
    }, []);

    useEffect(() => {
        const preventDefault = (e: any) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const handleDragLeave = () => {
            setOverlayIsVisible(false);
        };

        const handleOnDrop = (e: any) => {
            handleDragLeave();

            const files = e.dataTransfer!.files;
            if (!resource || !files) {
                return;
            }

            for (let i = 0; i < files.length; i++) {
                if (files[i].type) {
                    uploadDriveFile(resource.linkId, files[i]);
                }
            }
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
        <>
            <div ref={dropAreaRef}>{children}</div>
            {overlayIsVisible && (
                <div ref={overlayRef} className={'pd-drag-drop'}>
                    <section className="pd-drag-drop-infobox p2">
                        <img className="pd-drag-drop-image" src={dragdropImageSvg} alt="" aria-hidden="true" />
                        <h2 className="bold m0">{c('Title').t`Drop to upload`}</h2>
                        <p className="m0">{c('Info').t`Your file will be encrypted and then saved.`}</p>
                    </section>
                </div>
            )}
        </>
    );
};

export default UploadDragDrop;
