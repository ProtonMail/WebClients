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

        const handlePrevent = (e: any) => {
            e.preventDefault();
            e.stopPropagation();
        };

        dragDropEvents.forEach((eventName) => {
            dropAreaRef.current?.addEventListener(eventName, handlePrevent, false);
            overlayRef.current?.addEventListener(eventName, handlePrevent, false);
        });

        dragOverEvents.forEach((eventName) => {
            dropAreaRef.current?.addEventListener(eventName, handleDragOver, false);
        });

        overlayRef.current?.addEventListener('dragleave', handleDragLeave, false);
        overlayRef.current?.addEventListener('drop', handleOnDrop, false);

        return () => {
            dragDropEvents.forEach((eventName) => {
                dropAreaRef.current?.removeEventListener(eventName, handlePrevent, false);
                overlayRef.current?.removeEventListener(eventName, handlePrevent, false);
            });

            dragOverEvents.forEach((eventName) => {
                dropAreaRef.current?.removeEventListener(eventName, handleDragOver, false);
            });

            overlayRef.current?.removeEventListener('dragleave', handleDragLeave, false);
            overlayRef.current?.removeEventListener('drop', handleOnDrop, false);
        };
    }, []);

    return (
        <>
            <div ref={dropAreaRef}>{children}</div>
            <div ref={overlayRef} className={overlayIsVisible ? 'pd-drag-drop' : ''}>
                {overlayIsVisible && (
                    <div className="pd-drag-drop-infobox">
                        <img className="image" src={dragdropImageSvg} alt={c('Info').t`Drag and drop image`} />
                        <div className="title">Drop to upload</div>
                        <div className="text">Your file will be encrypted and then saved.</div>
                    </div>
                )}
            </div>
        </>
    );
};

export default UploadDragDrop;
