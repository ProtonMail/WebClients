import { getMailMappingError } from '@proton/activation/helpers/getMailMappingErrors';
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

export const formatItems = ({ isLabelMapping, mapping, labels, folders }: FormatItemsProps) => {
    return mapping
        .map<FolderMapItem>((item, index, collection) => {
            const disabled = (() => {
                const isRootFolder = item.providerPath.length === 1;
                const prevItem = collection[index - 1];
                if (
                    item.checked ||
                    isRootFolder ||
                    (prevItem && prevItem.checked && prevItem.folderChildIDS.includes(item.id))
                ) {
                    return false;
                }
                return true;
            })();

            return {
                ...item,
                disabled,
                errors: [],
                isLabel: isLabelMapping,
            };
        })
        .map((item, index, collection) => {
            const errors = getMailMappingError(item, labels, folders, collection, isLabelMapping);
            return { ...item, errors };
        });
};

export const formatMapping = (nextItems: FolderMapItem[]): MailImportFields['mapping'] =>
    nextItems.map((item) => omit(item, ['disabled', 'errors', 'isLabel']));
