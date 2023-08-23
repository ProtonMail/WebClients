import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Label } from '@proton/shared/lib/interfaces/Label';
import isTruthy from '@proton/utils/isTruthy';

import { MailImportFolder } from './MailImportFoldersParser/MailImportFoldersParser';

export const RESERVED_NAMES = ['scheduled', 'spam', 'trash', 'outbox'];

export const isNameTooLong = (folderPath: string) => new Blob([folderPath]).size >= 100;

export const isNameReserved = (folderPath: string) => RESERVED_NAMES.includes(folderPath.toLowerCase());

export const isNameAlreadyUsed = (name: string, paths: string[]) =>
    paths.some((i) => i.toLowerCase().trim() === name.toLowerCase().trim());

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

export const mappingHasNameTooLong = (mapping: MailImportFolder[]) =>
    mapping.some((m) => {
        const tooLong = isNameTooLong(m.protonPath[m.protonPath.length - 1]);
        return tooLong;
    });

export const mappingHasUnavailableNames = (
    mapping: MailImportFolder[],
    collection: Label[] | Folder[],
    isLabelMapping: boolean
) => {
    const destinations = mapping
        .map((m) => (isLabelMapping ? m.protonPath.join(m.separator) : m.protonPath.join(m.separator)))
        .filter(isTruthy);

    const paths = collection.map((m) => m.Path);

    return destinations.some((dest) => isNameAlreadyUsed(dest, paths));
};

export const mappingHasReservedNames = (mapping: MailImportFolder[]) =>
    mapping.some((m) => isNameReserved(m.protonPath.join(m.separator)));
