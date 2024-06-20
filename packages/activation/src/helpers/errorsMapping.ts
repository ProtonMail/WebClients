import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Label } from '@proton/shared/lib/interfaces/Label';

import { MailImportFolder } from './MailImportFoldersParser/MailImportFoldersParser';

const RESERVED_NAMES = ['scheduled', 'spam', 'trash', 'outbox', 'snoozed'];

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
     *
     * When `labelMapping` is `true` we check over folder names and vice versa
     *
     * This check can seem strange at first glance. Why when we import folders
     * we ensure that no labels have the same name and vice versa ?
     *
     * Because when importing folders if a folder has same name we move it's content directly inside.
     * Short answer is "Mapping is already done"
     *
     * On our side Label and folders as the same root entity so their names can't be the same.
     * So if we import folders and a local label has the same name, we need to ask for a rename.
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
