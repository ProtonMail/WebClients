import { useCallback, useMemo, useState } from 'react';

import { c } from 'ttag';

import { generateUID } from '@proton/components';
import { DS_STORE } from '@proton/shared/lib/drive/constants';

import { TransferState } from '../../../components/TransferManager/transfer';
import {
    isTransferConflict,
    isTransferFinished,
    isTransferInitializing,
    isTransferPending,
} from '../../../utils/transfer';
import type { UploadFileItem, UploadFileList, UploadFolderItem } from '../interface';
import type {
    FileUpload,
    FileUploadReady,
    FolderUpload,
    FolderUploadReady,
    UpdateCallback,
    UpdateCallbackParams,
    UpdateData,
    UpdateFilter,
    UpdateState,
    UploadQueue,
} from './interface';
import { UploadConflictError, UploadUserError } from './interface';

type LogCallback = (id: string, message: string) => void;

export default function useUploadQueue(log: LogCallback) {
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

    const add = useCallback(
        async (
            shareId: string,
            parentId: string,
            list: UploadFileList,
            isForPhotos: boolean = false,
            isSharedWithMe: boolean = false
        ): Promise<void> => {
            return new Promise((resolve, reject) => {
                setQueue((queue) => {
                    const errors: Error[] = [];
                    const conflictErrors: UploadConflictError[] = [];

                    const queueItem = queue.find((item) => item.shareId === shareId && item.linkId === parentId) || {
                        shareId,
                        linkId: parentId,
                        files: [],
                        folders: [],
                    };
                    for (const item of list) {
                        if ((item as UploadFileItem).file?.name === DS_STORE) {
                            continue;
                        }
                        try {
                            addItemToQueue(log, shareId, queueItem, item, isForPhotos, isSharedWithMe);
                        } catch (err: any) {
                            if ((err as Error).name === 'UploadConflictError') {
                                conflictErrors.push(err);
                            } else {
                                errors.push(err);
                            }
                        }
                    }
                    const newQueue = [
                        ...queue.filter((item) => item.shareId !== shareId || item.linkId !== parentId),
                        queueItem,
                    ];

                    if (conflictErrors.length > 0) {
                        errors.push(new UploadConflictError(conflictErrors[0].filename, conflictErrors.length - 1));
                    }
                    if (errors.length > 0) {
                        reject(errors);
                    } else {
                        resolve();
                    }
                    return newQueue;
                });
            });
        },
        []
    );

    const update = useCallback(
        (
            idOrFilter: UpdateFilter,
            newStateOrCallback: UpdateState,
            { mimeType, name, error, folderId, originalIsDraft, originalIsFolder }: UpdateData = {},
            callback?: UpdateCallback
        ) => {
            const filter = convertFilterToFunction(idOrFilter);
            const newStateCallback = convertNewStateToFunction(newStateOrCallback);
            const updateFileOrFolder = <T extends FileUpload | FolderUpload>(item: T) => {
                callback?.(item);
                const newState = newStateCallback(item);
                // If pause is set twice, prefer resumeState set already before
                // to not be locked in paused state forever.
                item.resumeState = newState === TransferState.Paused ? item.resumeState || item.state : undefined;
                item.state = newState;
                if (mimeType) {
                    item.meta.mimeType = mimeType;
                }
                if (name) {
                    item.meta.filename = name;
                }
                if (originalIsDraft) {
                    item.originalIsDraft = originalIsDraft;
                }
                if (originalIsFolder) {
                    item.originalIsFolder = originalIsFolder;
                }
                item.error = error;
                if (!!error) {
                    item.numberOfErrors++;
                }
                log(item.id, `Updated queue (state: ${newState}, error: ${error || ''})`);
            };
            const updateFile = (file: FileUpload): FileUpload => {
                if (filter(file)) {
                    updateFileOrFolder(file);
                }
                return file;
            };
            const updateFolder = (folder: FolderUpload): FolderUpload => {
                if (filter(folder)) {
                    // When parent folder is canceled, all childs would hang up
                    // in initializing state - therefore we need to cancel
                    // recursively all children.
                    if (newStateCallback(folder) === TransferState.Canceled) {
                        folder = recursiveCancel(log, folder);
                    }
                    updateFileOrFolder(folder);
                    if (folderId) {
                        folder.linkId = folderId;
                        folder.files = folder.files.map((file) => {
                            log(
                                file.id,
                                `Updated child (state: ${
                                    file.state === TransferState.Initializing ? TransferState.Pending : file.state
                                })`
                            );
                            return {
                                ...file,
                                parentId: folderId,
                                state: file.state === TransferState.Initializing ? TransferState.Pending : file.state,
                            };
                        });
                        folder.folders = folder.folders.map((folder) => {
                            log(
                                folder.id,
                                `Updated child (state: ${
                                    folder.state === TransferState.Initializing ? TransferState.Pending : folder.state
                                })`
                            );
                            return {
                                ...folder,
                                parentId: folderId,
                                state:
                                    folder.state === TransferState.Initializing ? TransferState.Pending : folder.state,
                            };
                        });
                    }
                }
                folder.files = folder.files.map(updateFile);
                folder.folders = folder.folders.map(updateFolder);
                // When any child is restarted after parent folder is canceled,
                // the child would hang up in initializing state - therefore we
                // need to restart also all canceled parents of that child.
                if (folder.state === TransferState.Canceled && hasInitializingUpload(folder)) {
                    folder.state = folder.parentId ? TransferState.Pending : TransferState.Initializing;
                }
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

export function addItemToQueue(
    log: LogCallback,
    shareId: string,
    newQueue: UploadQueue,
    item: UploadFileItem | UploadFolderItem,
    isForPhotos: boolean = false,
    isSharedWithMe: boolean = false
) {
    const name = (item as UploadFileItem).file ? (item as UploadFileItem).file.name : (item as UploadFolderItem).folder;
    if (!name) {
        throw new UploadUserError(c('Notification').t`File or folder is missing a name`);
    }

    const part = findUploadQueueFolder(newQueue, item.path);
    if (isNameAlreadyUploading(part, name)) {
        throw new UploadConflictError(name);
    }

    const id = generateUID();
    const state = part.linkId ? TransferState.Pending : TransferState.Initializing;
    const generalAttributes = {
        id,
        shareId,
        parentId: part.linkId,
        state,
        startDate: new Date(),
        isForPhotos,
        isSharedWithMe,
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
            numberOfErrors: 0,
        });
        log(
            id,
            `Added file to the queue (state: ${state}, parent: ${part.id}, type: ${fileItem.file.type}, size: ${fileItem.file.size} bytes)`
        );
    } else {
        const folderItem = item as UploadFolderItem;
        part.folders.push({
            ...generalAttributes,
            name: folderItem.folder,
            modificationTime: folderItem.modificationTime,
            files: [],
            folders: [],
            meta: {
                filename: folderItem.folder,
                size: 0,
                mimeType: 'Folder',
            },
            numberOfErrors: 0,
        });
        log(id, `Added folder to the queue (state: ${state}, parent: ${part.id})`);
    }
}

function findUploadQueueFolder(
    part: UploadQueue | FolderUpload,
    path: string[]
): (UploadQueue & { id: string }) | FolderUpload {
    if (path.length === 0) {
        return {
            id: 'root',
            ...part,
        };
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

function recursiveCancel(log: LogCallback, folder: FolderUpload): FolderUpload {
    return {
        ...folder,
        files: folder.files.map((file) => {
            log(file.id, 'Canceled by parent');
            return {
                ...file,
                state: TransferState.Canceled,
            };
        }),
        folders: folder.folders
            .map((folder) => {
                log(folder.id, 'Canceled by parent');
                return {
                    ...folder,
                    state: TransferState.Canceled,
                };
            })
            .map((subfolder) => recursiveCancel(log, subfolder)),
    };
}

function hasInitializingUpload(folder: FolderUpload): boolean {
    return (
        folder.files.some(isTransferInitializing) ||
        folder.folders.some(isTransferInitializing) ||
        folder.folders.some(hasInitializingUpload)
    );
}
