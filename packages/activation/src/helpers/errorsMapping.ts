import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Label } from '@proton/shared/lib/interfaces/Label';

import { MailImportFolder } from './MailImportFoldersParser/MailImportFoldersParser';

export const RESERVED_NAMES = ['scheduled', 'spam', 'trash', 'outbox'];

export const isNameTooLong = (folderPath: string) => new Blob([folderPath]).size >= 100;

export const isNameReserved = (folderPath: string) => RESERVED_NAMES.includes(folderPath.toLowerCase());

export const isNameAlreadyUsed = (
    item: MailImportFolder,
    collection: MailImportFolder[],
    labels: Label[],
    folders: Folder[],
    isLabelMapping: boolean
) => {
    const itemName = item.protonPath[item.protonPath.length - 1];

    /**
     * 1. Check if item has same name than folder or labels
     * Because Folder can't have the same name than a label and vice versa,
     * if `labelMapping` is `true` we check over folder names and vice versa
     */
    const folderOrLabelsCollection = isLabelMapping
        ? folders.map((item) => item.Path)
        : labels.map((item) => item.Path);
    const hasSameNameWithFoldersOrLabels = folderOrLabelsCollection.some(
        (path) => path.toLowerCase().trim() === itemName.toLowerCase().trim()
    );
    if (hasSameNameWithFoldersOrLabels) {
        return true;
    }

    /**
     * 2. Check if item has same name than other item in the collection
     */
    let isDuplicateNameError = false;
    for (const collectionItem of collection) {
        const isCurrentItem = collectionItem.id === item.id;
        if (!collectionItem.checked || isCurrentItem) {
            continue;
        }

        const collectionItemName = collectionItem.protonPath[collectionItem.protonPath.length - 1];
        const isDuplicateName = collectionItemName.toLowerCase().trim() === itemName.toLowerCase().trim();
        /**
         * If it's a label mapping, we don't care about the parent ID
         * because labels have no parent/child relationship
         */
        const hasSameParentID = isLabelMapping ? true : collectionItem.folderParentID === item.folderParentID;
        if (isDuplicateName && hasSameParentID) {
            isDuplicateNameError = true;
            break;
        }
    }

    return isDuplicateNameError;
};

export const isNameEmpty = (name: string | undefined) => !name || !name.trim();

export const hasMergeWarning = (
    collection: MailImportFolder[],
    folderItem: MailImportFolder,
    isLabelMapping: boolean
) => {
    return collection.some((item) => {
        const isNotCurrentFolderRow = item.id !== folderItem.id;
        const isSameInitialPath = item.id === folderItem.protonPath.join(folderItem.separator);

        return (
            folderItem.checked &&
            !isLabelMapping &&
            !folderItem.systemFolder &&
            isNotCurrentFolderRow &&
            isSameInitialPath
        );
    });
};
