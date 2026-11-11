import { useEffect, useRef } from 'react';

import { getLumoFileType } from '../../../remote/nativeComposerBridge';
import {
    isNativeComposerBridgeAvailable,
    onNativeHandleFileUploadRequest,
    onNativeOpenDriveRequest,
    onNativeOpenSketch,
    onNativeRemoveFile,
    setNativeComposerFiles,
    setNativeTsAndCsVisibility,
} from '../../../remote/nativeComposerBridgeHelpers';
import { attachmentDataCache } from '../../../services/attachmentDataCache';
import { type Attachment, ComposerMode } from '../../../types';

export const useNativeComposerFileApi = (
    composerMode: ComposerMode,
    provisionalAttachments: Attachment[],
    hasMessages: boolean,
    handleFilesFromNative: (files: { base64: string; name: string }[]) => void,
    handleBrowseDrive: () => void,
    handleDrawSketch: () => void,
    handleDeleteAttachment: (attachmentId: string) => void
): void => {
    const hasAttachments = provisionalAttachments.length > 0;

    // The web draft is authoritative. Project retrieval and message updates also write to the
    // attachment store, but must never populate the native composer's next-message attachments.
    useEffect(() => {
        if (!isNativeComposerBridgeAvailable()) return;
        setNativeComposerFiles(
            provisionalAttachments
                .filter((attachment) => !attachment.processing)
                .map((attachment) => {
                    const imageBytes = attachmentDataCache.getImagePreview(attachment.id);
                    return {
                        id: attachment.id,
                        name: attachment.filename,
                        type: getLumoFileType(attachment.mimeType ?? ''),
                        preview: imageBytes
                            ? btoa(imageBytes.reduce((data, byte) => data + String.fromCharCode(byte), ''))
                            : null,
                    };
                })
        );
    }, [provisionalAttachments]);

    useEffect(() => () => setNativeComposerFiles([]), []);

    useEffect(() => {
        setNativeTsAndCsVisibility(composerMode !== ComposerMode.GALLERY && !hasMessages && !hasAttachments);
    }, [composerMode, hasMessages, hasAttachments]);

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
