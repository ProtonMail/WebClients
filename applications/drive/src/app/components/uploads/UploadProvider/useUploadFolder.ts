import { c } from 'ttag';

import { isFolderLinkMeta } from '@proton/shared/lib/interfaces/drive/link';
import { TransferCancel } from '@proton/shared/lib/interfaces/drive/transfer';
import useDrive from '../../../hooks/drive/useDrive';
import useTrash from '../../../hooks/drive/useTrash';
import useQueuedFunction from '../../../hooks/util/useQueuedFunction';
import { TransferConflictStrategy, UploadFolderControls } from '../interface';
import { ConflictStrategyHandler } from './interface';
import useUploadHelper from './useUploadHelper';

interface Folder {
    isNewFolder: boolean;
    folderId: string;
}

export default function useUploadFolder() {
    const queuedFunction = useQueuedFunction();
    const { createNewFolder } = useDrive();
    const { trashLinks } = useTrash();
    const { findAvailableName, getLinkByName } = useUploadHelper();

    const createEmptyFolder = async (
        shareId: string,
        parentId: string,
        folderName: string,
        modificationTime?: Date
    ): Promise<Folder> => {
        const {
            Folder: { ID: folderId },
        } = await createNewFolder(shareId, parentId, folderName, modificationTime);
        return {
            folderId,
            isNewFolder: true,
        };
    };

    const getFolder = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentId: string,
        folderName: string
    ): Promise<Folder> => {
        const link = await getLinkByName(abortSignal, shareId, parentId, folderName);
        if (!link) {
            throw Error(c('Error').t`The original folder not found`);
        }
        if (!isFolderLinkMeta(link)) {
            throw Error(c('Error').t`File cannot be merged with folder`);
        }
        checkSignal(abortSignal, folderName);
        return {
            folderId: link.LinkID,
            isNewFolder: false,
        };
    };

    const replaceFolder = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentId: string,
        folderName: string,
        modificationTime: Date | undefined
    ): Promise<Folder> => {
        const link = await getLinkByName(abortSignal, shareId, parentId, folderName);
        if (!link) {
            throw Error(c('Error').t`The original folder or file not found`);
        }
        checkSignal(abortSignal, folderName);
        await trashLinks(shareId, parentId, [link.LinkID]);
        return createEmptyFolder(shareId, parentId, folderName, modificationTime);
    };

    const prepareFolder = (
        abortSignal: AbortSignal,
        shareId: string,
        parentId: string,
        folderName: string,
        modificationTime: Date | undefined,
        getFolderConflictStrategy: ConflictStrategyHandler
    ): Promise<Folder> => {
        const lowercaseName = folderName.toLowerCase();

        return queuedFunction(`upload_empty_folder:${lowercaseName}`, async () => {
            const { filename: newName } = await findAvailableName(abortSignal, shareId, parentId, folderName);
            checkSignal(abortSignal, folderName);
            if (folderName === newName) {
                return createEmptyFolder(shareId, parentId, folderName, modificationTime);
            }

            const link = await getLinkByName(abortSignal, shareId, parentId, folderName);
            const originalIsFolder = link ? isFolderLinkMeta(link) : false;
            checkSignal(abortSignal, folderName);
            const conflictStrategy = await getFolderConflictStrategy(abortSignal, originalIsFolder);
            if (conflictStrategy === TransferConflictStrategy.Rename) {
                return createEmptyFolder(shareId, parentId, newName, modificationTime);
            }
            if (conflictStrategy === TransferConflictStrategy.Replace) {
                return replaceFolder(abortSignal, shareId, parentId, folderName, modificationTime);
            }
            if (conflictStrategy === TransferConflictStrategy.Merge) {
                return getFolder(abortSignal, shareId, parentId, folderName);
            }
            if (conflictStrategy === TransferConflictStrategy.Skip) {
                throw new TransferCancel({ message: c('Info').t`Transfer skipped for folder "${folderName}"` });
            }
            throw new Error(`Unknown conflict strategy: ${conflictStrategy}`);
        })();
    };

    const initFolderUpload = (
        shareId: string,
        parentId: string,
        folderName: string,
        modificationTime: Date | undefined,
        getFolderConflictStrategy: ConflictStrategyHandler
    ): UploadFolderControls => {
        const abortController = new AbortController();
        return {
            start: () => {
                return prepareFolder(
                    abortController.signal,
                    shareId,
                    parentId,
                    folderName,
                    modificationTime,
                    getFolderConflictStrategy
                );
            },
            cancel: () => {
                abortController.abort();
            },
        };
    };

    return {
        initFolderUpload,
    };
}

function checkSignal(abortSignal: AbortSignal, name: string) {
    if (abortSignal.aborted) {
        throw new TransferCancel({ message: c('Info').t`Transfer canceled for folder "${name}"` });
    }
}
