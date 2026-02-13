import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

import isDeepEqual from 'lodash/isEqual';

import { getMailMappingErrors } from '@proton/activation/src/helpers/getMailMappingErrors';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';

import type { FolderMapItem, MailImportFields } from './CustomizeMailImportModal.interface';

interface Props {
    fields: MailImportFields;
    isLabelMapping: boolean;
    onClose: () => void;
    onSubmit: (nextFields: MailImportFields) => void;
    openConfirmModal: () => void;
}

const useCustomizeMailImportModal = ({ fields, onClose, onSubmit, openConfirmModal, isLabelMapping }: Props) => {
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const [customFields, setCustomFields] = useState<MailImportFields>({
        importAddress: fields.importAddress,
        mapping: fields.mapping,
        importLabel: fields.importLabel,
        importPeriod: fields.importPeriod,
        importCategoriesDestination: fields.importCategoriesDestination,
    });
    const [savedErroredIds, setSavedErroredIds] = useState<FolderMapItem['id'][]>([]);

    // [Errors] 1. Lets parse errors once when we open the modal
    const initialErrors = useMemo(
        () => getMailMappingErrors(customFields.mapping, isLabelMapping, labels, folders),
        []
    );
    // [Errors] 2. Lets keep track of saved errored inputs and checked/unchecked folders
    // to determine if errors are able to be submitted
    const mappingInfos = useMemo(() => {
        const checkedIds = customFields.mapping.filter((item) => item.checked).map((item) => item.id);
        return {
            hasErrors:
                initialErrors.erroredIds.filter((id) => checkedIds.includes(id) && !savedErroredIds.includes(id))
                    .length > 0,
            totalFoldersCount: customFields.mapping.filter((folder) => !folder.category).length,
            selectedFoldersCount: customFields.mapping.filter((folder) => folder.checked && !folder.category).length,
        };
    }, [customFields.mapping, savedErroredIds]);

    const submitDisabled = mappingInfos.selectedFoldersCount === 0 || mappingInfos.hasErrors;

    const hasChanged = () => {
        const changed = Object.keys(customFields).every((key) => {
            // @ts-expect-error ts and key fields
            const initialValue = fields[key];
            // @ts-expect-error ts and key fields
            const customValue = customFields[key];

            return isDeepEqual(initialValue, customValue);
        });

        return changed ? false : true;
    };

    const handleCancel = () => {
        if (hasChanged()) {
            openConfirmModal();
        } else {
            onClose();
        }
    };

    function handleChangeField<K extends keyof MailImportFields>(key: K, value: MailImportFields[K]) {
        const nextCustomFields = { ...customFields };
        nextCustomFields[key] = value;

        setCustomFields(nextCustomFields);
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.stopPropagation();

        if (submitDisabled) {
            return;
        }
        if (hasChanged()) {
            onSubmit(customFields);
        } else {
            onClose();
        }
    };

    const handleSaveErroredInput = (fieldId: FolderMapItem['id']) => {
        setSavedErroredIds([...savedErroredIds, fieldId]);
    };

    return {
        customFields,
        handleCancel,
        handleChangeField,
        handleSubmit,
        handleSaveErroredInput,
        selectedFoldersCount: mappingInfos.selectedFoldersCount,
        submitDisabled,
        totalFoldersCount: mappingInfos.totalFoldersCount,
    };
};

export default useCustomizeMailImportModal;
