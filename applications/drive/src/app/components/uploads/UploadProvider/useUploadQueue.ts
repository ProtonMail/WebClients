import { useCallback, useMemo, useState } from 'react';
import { c } from 'ttag';

import { generateUID } from '@proton/components';

import { TransferState } from '../../../interfaces/transfer';
import { isTransferPending, isTransferConflict, isTransferPaused, isTransferFinished } from '../../../utils/transfer';
import { UploadFileList } from '../interface';
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

        const conflictingUpload = Boolean(allUploads.find(isTransferConflict));
        if (conflictingUpload) {
            return { nextFileUpload, nextFolderUpload };
        }

        nextFileUpload = fileUploads.find((file) => isTransferPending(file) && file.parentId) as FileUploadReady;
        nextFolderUpload = folderUploads.find(
            (folder) => isTransferPending(folder) && folder.parentId
        ) as FolderUploadReady;
        return { nextFileUpload, nextFolderUpload };
    }, [allUploads, fileUploads, folderUploads]);

    const add = useCallback((shareId: string, parentId: string, list: UploadFileList) => {
        setQueue((queue) => {
            const queueItem = queue.find((item) => item.shareId === shareId && item.parentId === parentId) || {
                shareId,
                parentId,
                files: [],
                folders: [],
            };
            for (const item of list) {
                if (item.file?.name === DS_STORE) {
                    continue;
                }
                addItemToQueue(shareId, queueItem, item);
            }
            const newQueue = [
                ...queue.filter((item) => item.shareId !== shareId || item.parentId !== parentId),
                queueItem,
            ];
            return newQueue;
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
                            state: TransferState.Pending,
                        }));
                        folder.folders = folder.folders.map((folder) => ({
                            ...folder,
                            parentId: folderId,
                            state: TransferState.Pending,
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

        if (callback) {
            const doCallback = (item: UploadQueue | FolderUpload) => {
                item.files.filter(filter).forEach(callback);
                item.folders.filter(filter).forEach(callback);
                item.folders.forEach(doCallback);
            };
            queue.forEach(doCallback);
        }

        const doFilter = <T extends UploadQueue | FolderUpload>(item: T): T => {
            item.files = item.files.filter(invertFilter);
            item.folders = item.folders.filter(invertFilter).map(doFilter);
            return item;
        };
        setQueue([...queue.map(doFilter)]);
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

function convertFilterToFunction(filterOrId: UpdateFilter) {
    return typeof filterOrId === 'function' ? filterOrId : ({ id }: UpdateCallbackParams) => id === filterOrId;
}

function convertNewStateToFunction(newStateOrCallback: UpdateState) {
    return typeof newStateOrCallback === 'function' ? newStateOrCallback : () => newStateOrCallback;
}

function addItemToQueue(shareId: string, newQueue: UploadQueue, item: { path: string[]; file?: File }) {
    const name = item.file ? item.file.name : item.path.slice(-1)[0];
    if (!name) {
        throw new UploadUserError(c('Notification').t`File or folder is missing a name`);
    }

    const part = findUploadQueueFolder(newQueue, item.path);
    if (isNameAlreadyUploading(part, name)) {
        throw new UploadUserError(c('Notification').t`File "${name}" is already uploading`);
    }

    const generalAttributes = {
        id: generateUID(),
        shareId,
        state: part.parentId ? TransferState.Pending : TransferState.Initializing,
        startDate: new Date(),
    };
    if (item.file) {
        part.files.push({
            ...generalAttributes,
            parentId: item.path.length === 0 ? part.parentId : undefined,
            file: item.file,
            meta: {
                filename: name,
                size: item.file.size,
                mimeType: item.file.type,
            },
        });
    } else {
        part.folders.push({
            ...generalAttributes,
            parentId: item.path.length === 1 ? part.parentId : undefined,
            name,
            files: [],
            folders: [],
            meta: {
                filename: name,
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
    for (const folder of part.folders) {
        if (folder.name === nextStep) {
            return findUploadQueueFolder(folder, path.slice(1));
        }
    }
    if (path.length === 1) {
        return part;
    }
    throw new Error('Wrong file or folder structure');
}

function isNameAlreadyUploading(part: UploadQueue | FolderUpload, name: string): boolean {
    return Boolean(
        part.files.filter((upload) => !isTransferFinished(upload)).find(({ file }) => file.name === name) ||
            part.folders.filter((upload) => !isTransferFinished(upload)).find((folder) => folder.name === name)
    );
}
