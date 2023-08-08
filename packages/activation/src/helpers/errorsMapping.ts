import { MailImportFolder } from './MailImportFoldersParser/MailImportFoldersParser';

export const RESERVED_NAMES = ['scheduled', 'spam', 'trash', 'outbox'];

export const isNameTooLong = (folderPath: string) => new Blob([folderPath]).size >= 100;

export const isNameReserved = (folderPath: string) => RESERVED_NAMES.includes(folderPath.toLowerCase());

// To avoid creating issue if a children has the same name as a parent (somewhere in the tree),
// we need to compare the id of the item with the id of the item in the collection since they are unique and should be different
export const isNameAlreadyUsed = (itemId: string, paths: string[]) =>
    paths.some((i) => i.toLowerCase().trim() === itemId.toLowerCase().trim());

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

export const mappingHasReservedNames = (mapping: MailImportFolder[]) =>
    mapping.some((m) => isNameReserved(m.protonPath.join(m.separator)));
