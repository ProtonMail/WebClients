import { useEffect, useState } from 'react';

import { getMailMappingErrors } from '@proton/activation/helpers/getMailMappingErrors';
import { useFolders, useLabels } from '@proton/components/index';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';

import { MailImportFields } from './CustomizeMailImportModal.interface';

interface Props {
    fields: MailImportFields;
    isLabelMapping: boolean;
    onClose: () => void;
    onSubmit: (nextFields: MailImportFields) => void;
    openConfirmModal: () => void;
}

const useCustomiseMailImportModal = ({ fields, onClose, onSubmit, openConfirmModal, isLabelMapping }: Props) => {
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const [noEdit, setNoEdits] = useState(true);

    const [customFields, setCustomFields] = useState<MailImportFields>({
        importAddress: fields.importAddress,
        mapping: fields.mapping,
        importLabel: fields.importLabel,
        importPeriod: fields.importPeriod,
        importCategoriesDestination: fields.importCategoriesDestination,
    });
    const mappingValues = Object.values(customFields.mapping);

    const totalFoldersCount = mappingValues.filter((folder) => !folder.category).length;
    const selectedFoldersCount = mappingValues.filter((folder) => folder.checked && !folder.category).length;
    const submitDisabled = !selectedFoldersCount || !noEdit;

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

    const handleSubmit = () => {
        if (submitDisabled) {
            return;
        }
        if (hasChanged()) {
            onSubmit(customFields);
        } else {
            onClose();
        }
    };

    useEffect(() => {
        const mappingErrors = getMailMappingErrors(customFields.mapping, isLabelMapping, labels, folders);
        setNoEdits(mappingErrors.length === 0);
    }, []);

    return {
        customFields,
        handleCancel,
        handleChangeField,
        handleSubmit,
        submitDisabled,
        selectedFoldersCount,
        setNoEdits,
        totalFoldersCount,
    };
};

export default useCustomiseMailImportModal;
