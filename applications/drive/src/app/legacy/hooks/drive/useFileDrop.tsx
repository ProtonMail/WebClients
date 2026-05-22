import { useCallback } from 'react';

import { generateNodeUid } from '@proton/drive';
import { uploadManager } from '@proton/drive/modules/upload';

import type {
    OnFileSkippedSuccessCallbackData,
    OnFileUploadSuccessCallbackData,
    OnFolderUploadSuccessCallbackData,
} from '../../../legacy/store/_uploads/interface';

declare global {
    interface DataTransferItem {
        getAsEntry?: () => FileSystemEntry | null;
    }

    /** https://developer.mozilla.org/en-US/docs/Web/API/Metadata */
    interface FileSystemMetadata {
        modificationTime: Date;
    }

    interface FileSystemEntry {
        /** https://developer.mozilla.org/en-US/docs/Web/API/FileSystemEntry/getMetadata */
        getMetadata: (success: (meta: FileSystemMetadata) => void, failure: (error: Error) => void) => void;
    }
}

export const useFileDrop = ({
    isForPhotos = false,
    parentLinkId,
    volumeId,
}: {
    isForPhotos?: boolean;
    shareId: string;
    parentLinkId: string;
    volumeId: string;
    onFileUpload?: (file: OnFileUploadSuccessCallbackData) => void;
    onFolderUpload?: (folder: OnFolderUploadSuccessCallbackData) => void;
    onFileSkipped?: (folder: OnFileSkippedSuccessCallbackData) => void;
}) => {
    const handleDrop = useCallback(
        async (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            const { items } = e.dataTransfer;

            if (!items) {
                return;
            }

            const parentUid = generateNodeUid(volumeId, parentLinkId);
            return isForPhotos
                ? uploadManager.uploadPhotos(e.dataTransfer)
                : uploadManager.upload(e.dataTransfer, parentUid);
        },
        [volumeId, parentLinkId, isForPhotos]
    );

    return {
        handleDrop,
    };
};
