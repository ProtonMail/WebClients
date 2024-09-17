import { MAX_FOLDER_LIMIT } from '@proton/activation/src/constants';
import { MailImportPayloadError } from '@proton/activation/src/interface';
import type { Label } from '@proton/shared/lib/interfaces';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';

import type { MailImportFolder } from './MailImportFoldersParser/MailImportFoldersParser';
import { hasMergeWarning, isNameAlreadyUsed, isNameEmpty, isNameReserved, isNameTooLong } from './errorsMapping';

const {
    EMPTY,
    FOLDER_NAMES_TOO_LONG,
    LABEL_NAMES_TOO_LONG,
    MAX_FOLDERS_LIMIT_REACHED,
    RESERVED_NAMES,
    UNAVAILABLE_NAMES,
    MERGE_WARNING,
} = MailImportPayloadError;

export const getMailMappingError = (
    item: MailImportFolder,
    labels: Label[],
    folders: Folder[],
    collection: MailImportFolder[],
    isLabelMapping: boolean
): MailImportPayloadError[] => {
    const errors: MailImportPayloadError[] = [];
    const itemName = item.protonPath[item.protonPath.length - 1];

    if (item.checked) {
        if (isNameTooLong(itemName)) {
            errors.push(isLabelMapping ? LABEL_NAMES_TOO_LONG : FOLDER_NAMES_TOO_LONG);
        }
        if (isNameReserved(itemName)) {
            errors.push(RESERVED_NAMES);
        }
    }
    if (isNameAlreadyUsed(item, collection, labels, folders, isLabelMapping)) {
        errors.push(UNAVAILABLE_NAMES);
    }

    if (isNameEmpty(itemName)) {
        errors.push(EMPTY);
    }

    if (hasMergeWarning(collection, item, isLabelMapping)) {
        errors.push(MERGE_WARNING);
    }

    return errors;
};

type GetMailMappingErrorsResult = {
    errors: MailImportPayloadError[];
    erroredIds: MailImportFolder['id'][];
};
export const getMailMappingErrors = (
    importMapping: MailImportFolder[],
    isLabelMapping: boolean,
    labels: Label[],
    folders: Folder[]
): GetMailMappingErrorsResult => {
    const checkedMapping = importMapping.filter((m) => m.checked);

    const hasMaxFoldersError = checkedMapping.length + folders.length >= MAX_FOLDER_LIMIT;

    const errorsSet = new Set<MailImportPayloadError>([]);
    const erroredIds: MailImportFolder['id'][] = [];

    importMapping
        .filter((item) => {
            //We remove the items with categories when importing with Google to avoid conflicts if user has a folder named "Forums", "Updates", "Promotions" or "Social"
            return isLabelMapping ? !item.category : true;
        })
        .filter((item) => item.checked)
        .forEach((item) => {
            const itemErrors = getMailMappingError(item, labels, folders, importMapping, isLabelMapping);
            if (itemErrors.length) {
                itemErrors.forEach((error) => {
                    errorsSet.add(error);
                });
                erroredIds.push(item.id);
            }
        });

    // Check only on mapping
    if (hasMaxFoldersError) {
        errorsSet.add(MAX_FOLDERS_LIMIT_REACHED);
    }

    return {
        errors: Array.from(errorsSet),
        erroredIds,
    };
};
