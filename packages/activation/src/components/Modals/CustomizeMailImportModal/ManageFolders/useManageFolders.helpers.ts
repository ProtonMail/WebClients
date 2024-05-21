import { MailImportFolder } from '@proton/activation/src/helpers/MailImportFoldersParser/MailImportFoldersParser';
import { getMailMappingError } from '@proton/activation/src/helpers/getMailMappingErrors';
import { omit } from '@proton/shared/lib/helpers/object';
import { Label } from '@proton/shared/lib/interfaces';
import { Folder } from '@proton/shared/lib/interfaces/Folder';

import { FolderMapItem, MailImportFields } from '../CustomizeMailImportModal.interface';

interface FormatItemsProps {
    mapping: MailImportFields['mapping'];
    isLabelMapping: boolean;
    folders: Folder[];
    labels: Label[];
}

const isItemDisabled = (item: MailImportFolder, collection: MailImportFolder[]) => {
    const isRootFolder = item.providerPath.length === 1;
    const isParentItemChecked = collection.find((val) => val.id === item.folderParentID)?.checked;

    return !(item.checked || isRootFolder || isParentItemChecked);
};

export const formatItems = ({ isLabelMapping, mapping, labels, folders }: FormatItemsProps) => {
    return mapping
        .map<FolderMapItem>((item, _, collection) => {
            return {
                ...item,
                disabled: isItemDisabled(item, collection),
                errors: [],
                isLabel: isLabelMapping,
            };
        })
        .map((item, _, collection) => {
            const errors = getMailMappingError(item, labels, folders, collection, isLabelMapping);
            return { ...item, errors };
        });
};

/**
 * Rename all child folders with new name when a parent is updated
 * @param newFolder the current folder that is renamed
 * @param newFolders the list of all folders in the current mapping
 * @param newName the new name of the folder
 * @param isLabelMapping whether the mapping is for labels or folders
 * @returns an updated mapping where all childIDs of the updated folder are renamed
 */
export const renameChildFolders = (
    newFolder: FolderMapItem,
    newFolders: FolderMapItem[],
    newName: string,
    isLabelMapping: boolean
) => {
    const foldersCopy = [...newFolders];

    if (newFolder.folderChildIDS && newFolder.folderChildIDS.length) {
        newFolder.folderChildIDS.forEach((childId) => {
            const childFolderIndex = foldersCopy.findIndex((val) => val.id === childId);
            const childFolder = { ...foldersCopy[childFolderIndex] };
            if (!childFolder) {
                return;
            }

            const providerPathIndex = childFolder.providerPath.findIndex((item) => item === newFolder.id);
            if (providerPathIndex === -1) {
                return;
            }

            // In label mapping we want to split the current label into parts to only update the providerPathIndex index and not overide the whole string
            if (isLabelMapping) {
                const splittedProtonPath = childFolder.protonPath[0].split('-');
                splittedProtonPath[providerPathIndex] = newName;
                childFolder.protonPath = [splittedProtonPath.join('-')];
            } else {
                childFolder.protonPath = [...childFolder.protonPath];
                childFolder.protonPath[providerPathIndex] = newName;
            }

            foldersCopy[childFolderIndex] = childFolder;
        });
    }

    return foldersCopy;
};

export const formatMapping = (nextItems: FolderMapItem[]): MailImportFields['mapping'] =>
    nextItems.map((item) => omit(item, ['disabled', 'errors', 'isLabel']));
