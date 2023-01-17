import { FolderMapItem } from '@proton/activation/components/Modals/CustomizeMailImportModal/CustomizeMailImportModal.interface';
import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Label } from '@proton/shared/lib/interfaces/Label';
import isTruthy from '@proton/utils/isTruthy';

import { MailImportFolder } from './MailImportFoldersParser/MailImportFoldersParser';

export const RESERVED_NAMES = ['scheduled'];

export const isNameTooLong = (checked: boolean, folderPath: string) => {
    return checked && folderPath.length >= 100;
};

export const isNameReserved = (checked: boolean, folderPath: string) => {
    return checked && RESERVED_NAMES.includes(folderPath.toLowerCase());
};

export const isNameAlreadyUsed = (name: string, paths: string[]) => {
    return paths.some((i) => i.toLowerCase() === name.toLowerCase());
};

export const isNameEmpty = (name: string | undefined) => {
    return !name || !name.trim();
};

export const hasMergeWarning = (collection: FolderMapItem[], folderItem: FolderMapItem) => {
    return collection.some((item) => {
        const isNotCurrentFolderRow = item.id !== folderItem.id;
        const isSameInitialPath = item.id === folderItem.protonPath.join(folderItem.separator);

        return (
            folderItem.checked &&
            !folderItem.isLabel &&
            !folderItem.systemFolder &&
            isNotCurrentFolderRow &&
            isSameInitialPath
        );
    });
};

export const mappinghasNameTooLong = (mapping: MailImportFolder[]) => {
    return mapping.some((m) => {
        const tooLong = isNameTooLong(m.checked, m.protonPath[m.protonPath.length - 1]);
        return tooLong;
    });
};

export const mappingHasUnavailableNames = (
    mapping: MailImportFolder[],
    collection: Label[] | Folder[],
    isLabelMapping: boolean
) => {
    const destinations = mapping
        .filter((m) => m.checked)
        .map((m) => (isLabelMapping ? m.protonPath.join(m.separator) : m.protonPath.join(m.separator)))
        .filter(isTruthy);

    const paths = collection.map((m) => m.Path);

    return destinations.some((dest) => isNameAlreadyUsed(dest, paths));
};

export const mappingHasReservedNames = (mapping: MailImportFolder[]) => {
    return mapping.some((m) => isNameReserved(m.checked, m.protonPath.join(m.separator)));
};
