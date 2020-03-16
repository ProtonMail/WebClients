import React, { ReactNode, createRef, useState, useEffect } from 'react';
import { c } from 'ttag';
import { useDriveResource } from '../../Drive/DriveResourceProvider';
import useFiles from '../../../hooks/useFiles';

import dragdropImageSvg from './drag-drop-image.svg';

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
            dropAreaRef.current?.addEventListener(eventName, handleDragOver, false);
        });

        return () => {
            dragOverEvents.forEach((eventName) => {
                dropAreaRef.current?.removeEventListener(eventName, handleDragOver, false);
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

            const files = e.dataTransfer.files;
            if (!resource || !files) {
                return;
            }

            for (let i = 0; i < files.length; i++) {
                uploadDriveFile(resource.linkId, files[i]);
            }
        };

        dragDropEvents.forEach((eventName) => {
            overlayRef.current?.addEventListener(eventName, preventDefault, false);
        });

        overlayRef.current?.addEventListener('dragleave', handleDragLeave, false);
        overlayRef.current?.addEventListener('drop', handleOnDrop, false);

        return () => {
            dragDropEvents.forEach((eventName) => {
                overlayRef.current?.removeEventListener(eventName, preventDefault, false);
            });

            overlayRef.current?.removeEventListener('dragleave', handleDragLeave, false);
            overlayRef.current?.removeEventListener('drop', handleOnDrop, false);
        };
    }, [overlayIsVisible]);

    return (
        <>
            <div ref={dropAreaRef}>{children}</div>
            {overlayIsVisible && (
                <div ref={overlayRef} className={'pd-drag-drop'}>
                    <div className="pd-drag-drop-infobox">
                        <img className="image" src={dragdropImageSvg} alt="" />
                        <div className="title">{c('Title').t`Drop to upload`}</div>
                        <div className="text">{c('Info').t`Your file will be encrypted and then saved.`}</div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UploadDragDrop;
