import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import isDeepEqual from 'lodash/isEqual';

import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';

import { getMailMappingErrors } from '../../../helpers/getMailMappingErrors';
import type { ImportProvider } from '../../../interface';
import {
    trackAccountImportEasySwitchCustomizeMailImportCancelled,
    trackAccountImportEasySwitchCustomizeMailImportChanged,
    trackAccountImportEasySwitchCustomizeMailImportSaved,
    trackAccountImportEasySwitchCustomizeMailImportViewed,
} from '../../../telemetry/accountImportFlow';
import type { FolderMapItem, MailImportFields } from './CustomizeMailImportModal.interface';

const CHANGE_ACTIONS = {
    importAddress: 'change_address',
    importPeriod: 'change_period',
    importLabel: 'change_label',
    importCategoriesDestination: 'change_categories',
    mapping: 'change_folders',
} as const satisfies Record<keyof MailImportFields, string>;

interface Props {
    fields: MailImportFields;
    isLabelMapping: boolean;
    onClose: () => void;
    onSubmit: (nextFields: MailImportFields) => void;
    openConfirmModal: () => void;
    provider: ImportProvider | undefined;
}

const useCustomizeMailImportModal = ({
    fields,
    onClose,
    onSubmit,
    openConfirmModal,
    isLabelMapping,
    provider,
}: Props) => {
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const [customFields, setCustomFields] = useState<MailImportFields>({
        importAddress: fields.importAddress,
        mapping: fields.mapping,
        importLabel: fields.importLabel,
        importPeriod: fields.importPeriod,
        importCategoriesDestination: fields.importCategoriesDestination,
    });
    // A field is reported once per opening of the modal: we want to know which ones are touched, not how often
    const reportedFields = useRef(new Set<keyof MailImportFields>());

    useEffect(() => {
        trackAccountImportEasySwitchCustomizeMailImportViewed({ provider });
    }, []);

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
            trackAccountImportEasySwitchCustomizeMailImportCancelled({ provider, hasChanges: false });
            onClose();
        }
    };

    /** The user confirmed they leave without saving their edits */
    const handleDiscard = () => {
        trackAccountImportEasySwitchCustomizeMailImportCancelled({ provider, hasChanges: true });
        onClose();
    };

    function handleChangeField<K extends keyof MailImportFields>(key: K, value: MailImportFields[K]) {
        const nextCustomFields = { ...customFields };
        nextCustomFields[key] = value;

        setCustomFields(nextCustomFields);

        if (!reportedFields.current.has(key)) {
            reportedFields.current.add(key);
            trackAccountImportEasySwitchCustomizeMailImportChanged({
                provider,
                action: CHANGE_ACTIONS[key],
                importPeriod: key === 'importPeriod' ? (value as MailImportFields['importPeriod']) : undefined,
            });
        }
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.stopPropagation();

        if (submitDisabled) {
            return;
        }
        const changed = hasChanged();
        trackAccountImportEasySwitchCustomizeMailImportSaved({ provider, hasChanges: changed });
        if (changed) {
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
        handleDiscard,
        handleChangeField,
        handleSubmit,
        handleSaveErroredInput,
        selectedFoldersCount: mappingInfos.selectedFoldersCount,
        submitDisabled,
        totalFoldersCount: mappingInfos.totalFoldersCount,
    };
};

export default useCustomizeMailImportModal;
