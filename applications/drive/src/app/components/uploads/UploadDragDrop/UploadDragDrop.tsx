import React, { ReactNode, createRef, useState, useEffect } from 'react';
import { c } from 'ttag';
import { useDriveResource } from '../../Drive/DriveResourceProvider';
import useFiles from '../../../hooks/useFiles';

import dragdropImageSvg from './drag-drop-image.svg';

interface UploadDragDropProps {
    children: ReactNode;
}

const UploadDragDrop = ({ children }: UploadDragDropProps) => {
    const dropRef = createRef<HTMLDivElement>();
    const overlayRef = createRef<HTMLDivElement>();

    const { resource } = useDriveResource();
    const { uploadDriveFile } = useFiles(resource?.shareId ?? '');
    const [overlayIsVisible, setOverlayIsVisible] = useState(false);

    const dragOverEvents = ['dragenter', 'dragover'];
    const dragDropEvents = [...dragOverEvents, 'dragend', 'dragleave', 'drag', 'drop'];

    useEffect(() => {
        const handleDragOver = (e: any) => {
            setOverlayIsVisible(true);
        };

        const handleDragLeave = (e: any) => {
            setOverlayIsVisible(false);
        };

        const handleOnDrop = (e: any) => {
            handleDragLeave(e);

            const files = e.dataTransfer.files;
            if (!resource || !files) {
                return;
            }

            for (let i = 0; i < files.length; i++) {
                uploadDriveFile(resource.linkId, files[i]);
            }
        };

        const handlerPrevent = (e: any) => {
            e.preventDefault();
            e.stopPropagation();
        };

        dragDropEvents.forEach((eventName) => {
            dropRef.current?.addEventListener(eventName, handlerPrevent, false);
            overlayRef.current?.addEventListener(eventName, handlerPrevent, false);
        });

        dragOverEvents.forEach((eventName) => {
            dropRef.current?.addEventListener(eventName, handleDragOver, false);
        });

        overlayRef.current?.addEventListener('dragleave', handleDragLeave, false);
        overlayRef.current?.addEventListener('drop', handleOnDrop, false);

        return () => {
            dragDropEvents.forEach((eventName) => {
                dropRef.current?.removeEventListener(eventName, handlerPrevent, false);
                overlayRef.current?.removeEventListener(eventName, handlerPrevent, false);
            });

            dragOverEvents.forEach((eventName) => {
                dropRef.current?.removeEventListener(eventName, handleDragOver, false);
            });

            overlayRef.current?.removeEventListener('dragleave', handleDragLeave, false);
            overlayRef.current?.removeEventListener('drop', handleOnDrop, false);
        };
    }, []);

    return (
        <>
            <div ref={dropRef}>{children}</div>
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
