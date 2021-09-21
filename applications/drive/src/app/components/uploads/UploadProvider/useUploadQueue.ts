import { useCallback, useMemo, useState } from 'react';
import { c } from 'ttag';

import { generateUID } from '@proton/components';

import { TransferState } from '../../../interfaces/transfer';
import { isTransferPending, isTransferConflict, isTransferPaused, isTransferFinished } from '../../../utils/transfer';
import { UploadFileList, UploadFileItem, UploadFolderItem } from '../interface';
import {
    UploadQueue,
    FileUpload,
    FileUploadReady,
    FolderUpload,
    FolderUploadReady,
    UpdateFilter,
    UpdateState,
    UpdateData,
    UpdateCallback,
    UpdateCallbackParams,
    UploadUserError,
} from './interface';

const DS_STORE = '.DS_Store';

export default function useUploadQueue() {
    const [queue, setQueue] = useState<UploadQueue[]>([]);

    const fileUploads = useMemo((): FileUpload[] => {
        const f = ({ files, folders }: { files: FileUpload[]; folders: FolderUpload[] }): FileUpload[] => {
            return [...files, ...folders.flatMap(f)];
        };
        return queue.flatMap(f);
    }, [queue]);

    const folderUploads = useMemo((): FolderUpload[] => {
        const f = ({ folders }: { folders: FolderUpload[] }): FolderUpload[] => {
            return [...folders, ...folders.flatMap(f)];
        };
        return queue.flatMap(f);
    }, [queue]);

    const allUploads = useMemo((): (FileUpload | FolderUpload)[] => {
        return [...fileUploads, ...folderUploads];
    }, [fileUploads, folderUploads]);

    const hasUploads = useMemo((): boolean => {
        return allUploads.length > 0;
    }, [allUploads]);

    const { nextFileUpload, nextFolderUpload } = useMemo(() => {
        let nextFileUpload: FileUploadReady | undefined;
        let nextFolderUpload: FolderUploadReady | undefined;

        const conflictingUpload = allUploads.some(isTransferConflict);
        if (conflictingUpload) {
            return { nextFileUpload, nextFolderUpload };
        }

        nextFileUpload = fileUploads.find((file) => isTransferPending(file) && file.parentId) as FileUploadReady;
        nextFolderUpload = folderUploads.find(
            (folder) => isTransferPending(folder) && folder.parentId
        ) as FolderUploadReady;
        return { nextFileUpload, nextFolderUpload };
    }, [allUploads, fileUploads, folderUploads]);

    const add = useCallback(async (shareId: string, parentId: string, list: UploadFileList): Promise<void> => {
        return new Promise((resolve, reject) => {
            setQueue((queue) => {
                const queueItem = queue.find((item) => item.shareId === shareId && item.parentId === parentId) || {
                    shareId,
                    parentId,
                    files: [],
                    folders: [],
                };
                for (const item of list) {
                    if ((item as UploadFileItem).file?.name === DS_STORE) {
                        continue;
                    }
                    try {
                        addItemToQueue(shareId, queueItem, item);
                    } catch (err: any) {
                        reject(err);
                    }
                }
                const newQueue = [
                    ...queue.filter((item) => item.shareId !== shareId || item.parentId !== parentId),
                    queueItem,
                ];
                resolve();
                return newQueue;
            });
        });
    }, []);

    const update = useCallback(
        (
            idOrFilter: UpdateFilter,
            newStateOrCallback: UpdateState,
            { mimeType, name, error, folderId, originalIsFolder }: UpdateData = {},
            callback?: UpdateCallback
        ) => {
            const filter = convertFilterToFunction(idOrFilter);
            const newStateCallback = convertNewStateToFunction(newStateOrCallback);
            const updateFileOrFolder = <T extends FileUpload | FolderUpload>(item: T) => {
                callback?.(item);
                const newState = newStateCallback(item);
                item.resumeState = isTransferPaused(item) ? newState : item.state;
                item.state = newState;
                if (mimeType) {
                    item.meta.mimeType = mimeType;
                }
                if (name) {
                    item.meta.filename = name;
                }
                if (error) {
                    item.error = error;
                }
            };
            const updateFile = (file: FileUpload): FileUpload => {
                if (filter(file)) {
                    updateFileOrFolder(file);
                }
                return file;
            };
            const updateFolder = (folder: FolderUpload): FolderUpload => {
                if (filter(folder)) {
                    updateFileOrFolder(folder);
                    if (folderId) {
                        folder.linkId = folderId;
                        folder.files = folder.files.map((file) => ({
                            ...file,
                            parentId: folderId,
                            state: file.state === TransferState.Initializing ? TransferState.Pending : file.state,
                        }));
                        folder.folders = folder.folders.map((folder) => ({
                            ...folder,
                            parentId: folderId,
                            state: folder.state === TransferState.Initializing ? TransferState.Pending : folder.state,
                        }));
                    }
                    if (originalIsFolder) {
                        folder.originalIsFolder = originalIsFolder;
                    }
                }
                folder.files = folder.files.map(updateFile);
                folder.folders = folder.folders.map(updateFolder);
                return folder;
            };
            setQueue((queue) => [
                ...queue.map((item) => {
                    item.files = item.files.map(updateFile);
                    item.folders = item.folders.map(updateFolder);
                    return item;
                }),
            ]);
        },
        []
    );

    const updateState = useCallback(
        (idOrFilter: UpdateFilter, newStateOrCallback: UpdateState) => {
            update(idOrFilter, newStateOrCallback);
        },
        [update]
    );

    const updateWithData = useCallback(
        (idOrFilter: UpdateFilter, newStateOrCallback: UpdateState, data: UpdateData = {}) => {
            update(idOrFilter, newStateOrCallback, data);
        },
        [update]
    );

    const updateWithCallback = useCallback(
        (idOrFilter: UpdateFilter, newStateOrCallback: UpdateState, callback: UpdateCallback) => {
            update(idOrFilter, newStateOrCallback, {}, callback);
        },
        [update]
    );

    const remove = useCallback((idOrFilter: UpdateFilter, callback?: UpdateCallback) => {
        const filter = convertFilterToFunction(idOrFilter);
        const invertFilter: UpdateFilter = (item) => !filter(item);

        setQueue((queue) => {
            if (callback) {
                const recursiveCallback = (item: FolderUpload) => {
                    callback(item);
                    item.files.forEach((value) => callback(value));
                    item.folders.forEach(recursiveCallback);
                };
                const doCallback = (item: UploadQueue | FolderUpload) => {
                    item.files.filter(filter).forEach((value) => callback(value));
                    item.folders.filter(filter).forEach(recursiveCallback);
                    item.folders.forEach(doCallback);
                };
                queue.forEach(doCallback);
            }

            const doFilter = <T extends UploadQueue | FolderUpload>(item: T): T => {
                item.files = item.files.filter(invertFilter);
                item.folders = item.folders.filter(invertFilter).map(doFilter);
                return item;
            };
            return [...queue.map(doFilter)];
        });
    }, []);

    const clear = useCallback(() => {
        setQueue([]);
    }, []);

    return {
        fileUploads,
        folderUploads,
        allUploads,
        hasUploads,
        nextFileUpload,
        nextFolderUpload,
        add,
        updateState,
        updateWithData,
        updateWithCallback,
        remove,
        clear,
    };
}

export function convertFilterToFunction(filterOrId: UpdateFilter) {
    return typeof filterOrId === 'function' ? filterOrId : ({ id }: UpdateCallbackParams) => id === filterOrId;
}

function convertNewStateToFunction(newStateOrCallback: UpdateState) {
    return typeof newStateOrCallback === 'function' ? newStateOrCallback : () => newStateOrCallback;
}

export function addItemToQueue(shareId: string, newQueue: UploadQueue, item: UploadFileItem | UploadFolderItem) {
    const name = (item as UploadFileItem).file ? (item as UploadFileItem).file.name : (item as UploadFolderItem).folder;
    if (!name) {
        throw new UploadUserError(c('Notification').t`File or folder is missing a name`);
    }

    const part = findUploadQueueFolder(newQueue, item.path);
    if (isNameAlreadyUploading(part, name)) {
        throw new UploadUserError(c('Notification').t`File or folder "${name}" is already uploading`);
    }

    const generalAttributes = {
        id: generateUID(),
        shareId,
        parentId: item.path.length === 0 ? part.parentId : undefined,
        state: item.path.length === 0 ? TransferState.Pending : TransferState.Initializing,
        startDate: new Date(),
    };
    if ((item as UploadFileItem).file) {
        const fileItem = item as UploadFileItem;
        part.files.push({
            ...generalAttributes,
            file: fileItem.file,
            meta: {
                filename: name,
                size: fileItem.file.size,
                mimeType: fileItem.file.type,
            },
        });
    } else {
        const folderItem = item as UploadFolderItem;
        part.folders.push({
            ...generalAttributes,
            name: folderItem.folder,
            files: [],
            folders: [],
            meta: {
                filename: folderItem.folder,
                size: 0,
                mimeType: 'Folder',
            },
        });
    }
}

function findUploadQueueFolder(part: UploadQueue | FolderUpload, path: string[]): UploadQueue | FolderUpload {
    if (path.length === 0) {
        return part;
    }

    const nextStep = path[0];
    const sortedMatchingFolders = part.folders
        // Find all folders with the same name. This can happen in situation
        // when user uploads folder and after its done, user uploads it again.
        .filter(({ name }) => name === nextStep)
        // Sort it by date, the latest one is at the beginning of the array.
        // We want to add new uploads to the latest folder, not the one which
        // was already finished before.
        .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    // Folders can have the same startDate (mostly in unit test, probably not
    // in real world), but lets explicitely always prefer non finished folder
    // to be super sure.
    const folder = sortedMatchingFolders.find((folder) => !isTransferFinished(folder)) || sortedMatchingFolders[0];
    if (folder) {
        return findUploadQueueFolder(folder, path.slice(1));
    }

    throw new Error('Wrong file or folder structure');
}

function isNameAlreadyUploading(part: UploadQueue | FolderUpload, name: string): boolean {
    const recursiveIsNotFinished = (upload: FolderUpload): boolean => {
        return (
            !isTransferFinished(upload) ||
            upload.files.some((upload) => !isTransferFinished(upload)) ||
            upload.folders.some(recursiveIsNotFinished)
        );
    };
    return (
        part.files.filter((upload) => !isTransferFinished(upload)).some(({ file }) => file.name === name) ||
        part.folders.filter(recursiveIsNotFinished).some((folder) => folder.name === name)
    );
}
