import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { DS_STORE } from '@proton/shared/lib/drive/constants';
import {
    getFileExtension,
    isImage,
    isRAWThumbnailExtractionSupported,
    isVideo,
} from '@proton/shared/lib/helpers/mimetype';

import { mimeTypeFromFile, useUpload } from '../../store/_uploads';
import type {
    OnFileSkippedSuccessCallbackData,
    OnFileUploadSuccessCallbackData,
    OnFolderUploadSuccessCallbackData,
    UploadFileList,
} from '../../store/_uploads/interface';
import { isTransferCancelError } from '../../utils/transfer';

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
    shareId,
    parentLinkId,
    onFileUpload,
    onFolderUpload,
    onFileSkipped,
}: {
    isForPhotos?: boolean;
    shareId: string;
    parentLinkId: string;
    onFileUpload?: (file: OnFileUploadSuccessCallbackData) => void;
    onFolderUpload?: (folder: OnFolderUploadSuccessCallbackData) => void;
    onFileSkipped?: (folder: OnFileSkippedSuccessCallbackData) => void;
}) => {
    const { createNotification } = useNotifications();
    const { uploadFiles } = useUpload();

    const handleDrop = useCallback(
        async (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            const { items } = e.dataTransfer;

            if (!items) {
                return;
            }

            const filesToUpload: UploadFileList = [];

            let unSupportedFiles = false;

            const traverseDirectories = async (item: FileSystemEntry, path: string[] = []) => {
                if (item.isFile) {
                    const fileItem = item as FileSystemFileEntry;

                    return new Promise<void>((resolve, reject) => {
                        fileItem.file(
                            async (file: File) => {
                                // For photos, we check if the image format is supported
                                if (
                                    isForPhotos &&
                                    !(await mimeTypeFromFile(file).then(
                                        (mime) =>
                                            isImage(mime) ||
                                            isVideo(mime) ||
                                            isRAWThumbnailExtractionSupported(mime, getFileExtension(file.name))
                                    )) &&
                                    file.name !== DS_STORE
                                ) {
                                    unSupportedFiles = true;
                                    resolve();
                                    return;
                                }

                                filesToUpload.push({ path, file });
                                resolve();
                            },
                            (error: Error) => {
                                createNotification({
                                    type: 'warning',
                                    // translator: here is an example of full sentence: File ".abc" cannot be uploaded due to "browser specific error such as hidden files are not allowed" error
                                    text: c('Error').t`File "${item.name}" cannot be uploaded due to "${error}" error`,
                                    preWrap: true,
                                });
                                reject(new Error(`Unable to get File ${item}: ${error}`));
                            }
                        );
                    });
                }

                if (item.isDirectory) {
                    const folderItem = item as FileSystemDirectoryEntry;
                    const reader = folderItem.createReader();

                    // For photos we don't push folder
                    if (!isForPhotos) {
                        const modificationTime = await new Promise<FileSystemMetadata>((resolve, reject) => {
                            folderItem.getMetadata(resolve, reject);
                        })
                            .then((metadata) => {
                                return metadata.modificationTime;
                            })
                            .catch(() => {
                                // For example, Firefox does not support `getMetadata`
                                // and there is no other way to get modification time
                                // at this moment.
                                return undefined;
                            });

                        filesToUpload.push({
                            path,
                            folder: item.name,
                            modificationTime,
                        });
                    }

                    // Iterates over folders recursively and puts them into filesToUpload list
                    const getEntries = async () => {
                        const promises: Promise<void>[] = [];

                        // Folders are read in batch, need to wait
                        await new Promise<PromiseSettledResult<void>[] | void>((resolve, reject) => {
                            reader.readEntries(
                                (entries) => {
                                    if (entries.length) {
                                        entries.forEach((entry) =>
                                            promises.push(
                                                // For photos we don't push file/folder structure
                                                traverseDirectories(entry, isForPhotos ? [] : [...path, item.name])
                                            )
                                        );
                                        resolve(getEntries());
                                    } else {
                                        resolve();
                                    }
                                },
                                (error: Error) => reject(new Error(`Unable to traverse directory ${item}: ${error}`))
                            );
                        });

                        return Promise.allSettled(promises);
                    };
                    await getEntries();
                }
            };

            const promises: Promise<void>[] = [];
            for (let i = 0; i < items.length; i++) {
                const item = items[i].getAsEntry ? items[i].getAsEntry?.() : items[i].webkitGetAsEntry();

                if (item) {
                    promises.push(traverseDirectories(item));
                }
            }

            // Need to wait for all files to have been read
            const results = await Promise.allSettled(promises);

            if (unSupportedFiles) {
                createNotification({
                    type: 'warning',
                    text: c('Error').t`Some files were ignored because they are not supported in Photos`,
                });
            }
            const errors = results.reduce((err, result) => {
                if (result.status === 'rejected') {
                    err.push(result.reason);
                }
                return err;
            }, [] as string[]);

            if (errors.length) {
                console.error(errors);
            }

            uploadFiles(
                shareId,
                parentLinkId,
                filesToUpload,
                isForPhotos,
                onFileUpload,
                onFileSkipped,
                onFolderUpload
            ).catch((err) => {
                if (!isTransferCancelError(err)) {
                    console.error(err);
                }
            });
        },
        [isForPhotos, shareId, parentLinkId, onFileUpload, onFileSkipped, onFolderUpload]
    );

    return {
        handleDrop,
    };
};
