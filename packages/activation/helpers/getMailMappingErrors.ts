import { FolderMapItem } from '@proton/activation/components/Modals/CustomizeMailImportModal/CustomizeMailImportModal.interface';
import { MAX_FOLDER_LIMIT } from '@proton/activation/constants';
import { MailImportPayloadError } from '@proton/activation/interface';
import { Label } from '@proton/shared/lib/interfaces';
import { Folder } from '@proton/shared/lib/interfaces/Folder';

import { MailImportFolder } from './MailImportFoldersParser/MailImportFoldersParser';
import {
    hasMergeWarning,
    isNameAlreadyUsed,
    isNameEmpty,
    isNameReserved,
    isNameTooLong,
    mappingHasReservedNames,
    mappingHasUnavailableNames,
    mappinghasNameTooLong,
} from './errorsMapping';

const {
    EMPTY,
    FOLDER_NAMES_TOO_LONG,
    LABEL_NAMES_TOO_LONG,
    MAX_FOLDERS_LIMIT_REACHED,
    RESERVED_NAMES,
    UNAVAILABLE_NAMES,
    MERGE_WARNING,
} = MailImportPayloadError;

export const getMailMappingErrors = (
    mapping: MailImportFolder[],
    isLabelMapping: boolean,
    labels: Label[],
    folders: Folder[]
): MailImportPayloadError[] => {
    /* Mail mapping errors */
    const hasMaxFoldersError = (mapping: MailImportFolder[]) =>
        mapping.filter((m) => m.checked).length + folders.length >= MAX_FOLDER_LIMIT;
    const hasUnavailableNamesError = (mapping: MailImportFolder[]) =>
        mappingHasUnavailableNames(mapping, isLabelMapping ? folders : labels, isLabelMapping);
    const hasNameTooLong = (mapping: MailImportFolder[]) => mappinghasNameTooLong(mapping);
    const hasReservedNamesError = (mapping: MailImportFolder[]) => mappingHasReservedNames(mapping);

    const errors = [];

    if (hasMaxFoldersError(mapping)) {
        errors.push(MAX_FOLDERS_LIMIT_REACHED);
    }
    if (hasNameTooLong(mapping)) {
        errors.push(isLabelMapping ? LABEL_NAMES_TOO_LONG : FOLDER_NAMES_TOO_LONG);
    }
    if (hasUnavailableNamesError(mapping)) {
        errors.push(UNAVAILABLE_NAMES);
    }
    if (hasReservedNamesError(mapping)) {
        errors.push(RESERVED_NAMES);
    }

    return errors;
};

export const getMailMappingError = (
    item: FolderMapItem,
    labels: Label[],
    folders: Folder[],
    collection: FolderMapItem[],
    isLabelMapping: boolean
): MailImportPayloadError[] => {
    const errors: MailImportPayloadError[] = [];

    const collectionWithoutCurrentItem = collection.filter((m) => m.id !== item.id);

    const paths = [
        ...collectionWithoutCurrentItem.map((m) => m.id),
        ...labels.map((item) => item.Path),
        ...folders.map((item) => item.Path),
    ];

    const itemName = item.protonPath[item.protonPath.length - 1];

    const hasFoldersTooLongError = isNameTooLong(item.checked, itemName);
    const hasReservedNamesError = isNameReserved(item.checked, itemName);
    const hasUnavailableNamesError = isNameAlreadyUsed(itemName, paths);
    const hasEmptyError = isNameEmpty(itemName);
    const hasMergeWarningError = hasMergeWarning(collection, item);

    if (hasFoldersTooLongError) {
        errors.push(isLabelMapping ? LABEL_NAMES_TOO_LONG : FOLDER_NAMES_TOO_LONG);
    }
    if (hasReservedNamesError) {
        errors.push(RESERVED_NAMES);
    }
    if (hasUnavailableNamesError) {
        errors.push(UNAVAILABLE_NAMES);
    }
    if (hasEmptyError) {
        errors.push(EMPTY);
    }
    if (hasMergeWarningError) {
        errors.push(MERGE_WARNING);
    }

    return errors;
};
