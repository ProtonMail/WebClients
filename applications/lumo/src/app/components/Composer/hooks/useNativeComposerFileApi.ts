import { useEffect, useRef } from 'react';

import {
    clearNativeComposerFiles,
    onNativeHandleFileUploadRequest,
    onNativeOpenDriveRequest,
    onNativeOpenSketch,
    onNativeRemoveFile,
    setNativeTsAndCsVisibility,
} from '../../../remote/nativeComposerBridgeHelpers';
import type { Attachment } from '../../../types';

export const useNativeComposerFileApi = (
    hasAttachments: boolean,
    allRelevantAttachments: Attachment[],
    handleFilesFromNative: (files: { base64: string; name: string }[]) => void,
    handleBrowseDrive: () => void,
    handleDrawSketch: () => void,
    handleDeleteAttachment: (attachmentId: string) => void
): void => {
    useEffect(() => {
        if (!hasAttachments) {
            clearNativeComposerFiles();
            console.log(`removed all files`);
        }
        setNativeTsAndCsVisibility(!hasAttachments);
    }, [hasAttachments]);

    // useEffect(() => {
    //     const unsubscribePreviewFile = onNativePreviewFile((event) => {
    //         const { attachmentId } = event.detail;
    //         const file = allRelevantAttachments.find((attachment: Attachment) => attachment.id === attachmentId);
    //         if (file) {
    //             setFileToView(file);
    //         }
    //         console.log('Received native preview file event');
    //     });
    //     return () => {
    //         unsubscribePreviewFile();
    //     };
    // }, [allRelevantAttachments, setFileToView]);

    const handleFilesFromNativeRef = useRef<((files: { base64: string; name: string }[]) => void) | null>(null);
    const handleBrowseDriveRef = useRef<(() => void) | null>(null);
    const handleDeleteAttachmentRef = useRef<((attachmentId: string) => void) | null>(null);
    const handleDrawSketchRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        handleFilesFromNativeRef.current = handleFilesFromNative;
        handleBrowseDriveRef.current = handleBrowseDrive;
        handleDeleteAttachmentRef.current = handleDeleteAttachment;
        handleDrawSketchRef.current = handleDrawSketch;
    }, [handleFilesFromNative, handleBrowseDrive, handleDeleteAttachment, handleDrawSketch]);

    // use the previously defined references to avoid triggering this effect for every character change
    useEffect(() => {
        console.log('Registered file handling');

        const unsubscribeFileUpload = onNativeHandleFileUploadRequest((event) => {
            console.log('Received open file picker listener', event.detail.files);
            handleFilesFromNativeRef.current?.(event.detail.files);
        });

        const unsubscribeOpenDrive = onNativeOpenDriveRequest((_) => {
            console.log('Received open drive listener');
            handleBrowseDriveRef.current?.();
        });

        const unsubscribeOpenSketch = onNativeOpenSketch((_) => {
            console.log('Received open sketch listener');
            handleDrawSketchRef.current?.();
        });

        const unsubscribeDeleteFile = onNativeRemoveFile(async (event) => {
            console.log('Received remove file listener');
            const { attachmentId } = event.detail;
            handleDeleteAttachmentRef.current?.(attachmentId);
        });

        return () => {
            console.log('Un-registered file handling listener');
            unsubscribeFileUpload();
            unsubscribeOpenDrive();
            unsubscribeOpenSketch();
            unsubscribeDeleteFile();
        };
    }, []);
};
