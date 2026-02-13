import { useMemo, useState } from 'react';

import cloneDeep from 'lodash/cloneDeep';
import isDeepEqual from 'lodash/isEqual';

import { GMAIL_CATEGORIES, IMAPS } from '@proton/activation/src/constants';
import type { MailImportFolder } from '@proton/activation/src/helpers/MailImportFoldersParser/MailImportFoldersParser';
import { getDefaultTimePeriod } from '@proton/activation/src/helpers/getDefaultTimePeriod';
import { getMailMappingErrors } from '@proton/activation/src/helpers/getMailMappingErrors';
import useAvailableAddresses from '@proton/activation/src/hooks/useAvailableAddresses';
import type { TIME_PERIOD } from '@proton/activation/src/interface';
import { MailImportDestinationFolder, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import {
    displayConfirmLeaveModal,
    saveImapMailFields,
    startImapMailImport,
} from '@proton/activation/src/logic/draft/imapDraft/imapDraft.actions';
import { selectImapDraftMailImport } from '@proton/activation/src/logic/draft/imapDraft/imapDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import type { Address, Label, UserModel } from '@proton/shared/lib/interfaces';

import type { MailImportFields } from '../../../CustomizeMailImportModal/CustomizeMailImportModal.interface';
import { formatPrepareStepPayload } from './StepPrepareImap.helpers';
import getDefaultLabel from './useStepPrepareImap.helpers';

type ImportLabel = Pick<Label, 'Color' | 'Name' | 'Type'>;
type Fields = {
    mapping: {
        value: MailImportFolder[];
        initialValue: MailImportFolder[];
        isUpdated: boolean;
    };
    importLabel: {
        value: ImportLabel;
        initialValue: ImportLabel;
        isUpdated: boolean;
    };
    importPeriod: {
        value: TIME_PERIOD;
        initialValue: TIME_PERIOD;
        isUpdated: boolean;
    };
    importAddress: {
        value: Address;
        initialValue: Address;
        isUpdated: boolean;
    };
    importCategoriesDestination: {
        value: MailImportDestinationFolder;
        initialValue: MailImportDestinationFolder;
        isUpdated: boolean;
    };
};

export type StepPrepareData = ReturnType<typeof useStepPrepare>;

interface Props {
    user: UserModel;
    handleCloseCustomizeModal: () => void;
}

const useStepPrepare = ({ user, handleCloseCustomizeModal }: Props) => {
    const dispatch = useEasySwitchDispatch();
    const { defaultAddress } = useAvailableAddresses();
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const data = useEasySwitchSelector(selectImapDraftMailImport);
    if (!data) {
        throw new Error('Data should be defined');
    }

    const {
        domain,
        email = '',
        foldersMapping = [],
        loading: connectingToProvider,
        apiImporterID: importerID,
        password,
    } = data;
    const isLabelMapping = domain === IMAPS[OAUTH_PROVIDER.GOOGLE];

    const hasCategories = useMemo(() => foldersMapping.some((item) => item.category), []);

    const [customFields, setCustomFields] = useState<Fields>(() => {
        const defaultImportPeriod = getDefaultTimePeriod(user);
        const defaultLabel = getDefaultLabel(email);

        const defaultImportCategoriesDestination = (() => {
            const firstMappingItemWithCategory = foldersMapping.find(
                (item) => item.category && GMAIL_CATEGORIES.includes(item.category)
            );
            return firstMappingItemWithCategory?.systemFolder || MailImportDestinationFolder.INBOX;
        })();

        const fields: Fields = {
            mapping: {
                value: foldersMapping,
                initialValue: foldersMapping,
                isUpdated: false,
            },
            importLabel: {
                value: defaultLabel,
                initialValue: defaultLabel,
                isUpdated: false,
            },
            importPeriod: {
                value: defaultImportPeriod,
                initialValue: defaultImportPeriod,
                isUpdated: false,
            },
            importAddress: {
                value: defaultAddress!,
                initialValue: defaultAddress!,
                isUpdated: false,
            },
            importCategoriesDestination: {
                value: defaultImportCategoriesDestination,
                initialValue: defaultImportCategoriesDestination,
                isUpdated: false,
            },
        };

        return fields;
    });

    const mailMappingErrors = getMailMappingErrors(customFields.mapping.value, isLabelMapping, labels, folders);
    const hasErrors = mailMappingErrors.errors.length > 0;
    const selectedFolders = customFields.mapping.value.filter((folder) => folder.checked);
    const importSize = selectedFolders.reduce((acc, folder) => {
        acc += folder.size;
        return acc;
    }, 0);
    const fields: MailImportFields = {
        mapping: customFields.mapping.value,
        importLabel: customFields.importLabel.value,
        importPeriod: customFields.importPeriod.value,
        importAddress: customFields.importAddress.value,
        importCategoriesDestination: customFields.importCategoriesDestination.value,
    };

    const handleUpdateField = <K extends keyof Fields>(fieldKey: K, value: Fields[K]['value']) => {
        setCustomFields({
            ...customFields,
            [fieldKey]: {
                ...customFields[fieldKey],
                value,
                isUpdated: isDeepEqual(customFields[fieldKey].initialValue, value),
            },
        });
    };

    const handleUpdateFields = (updatedFields: { [K in keyof Fields]: Fields[K]['value'] }) => {
        const nextFields = cloneDeep(customFields);
        for (const k in updatedFields) {
            const key = k as keyof Fields;
            nextFields[key].value = updatedFields[key];
            nextFields[key].isUpdated = isDeepEqual(nextFields[key].initialValue, updatedFields[key]);
        }

        setCustomFields(nextFields);
    };

    const handleSubmitCustomizeModal = (updatedFields: MailImportFields) => {
        handleUpdateFields(updatedFields);
        handleCloseCustomizeModal();
    };

    const handleReset = () => {
        const nextFields = cloneDeep(customFields);
        for (const k in nextFields) {
            const key = k as keyof Fields;
            nextFields[key].value = nextFields[key].initialValue;
            nextFields[key].isUpdated = false;
        }

        setCustomFields(nextFields);
    };

    const handleCancel = () => {
        dispatch(displayConfirmLeaveModal(true));
    };

    const handleSubmit = () => {
        if (hasErrors) {
            return;
        }

        dispatch(saveImapMailFields(fields));

        const payload = formatPrepareStepPayload({
            isLabelMapping,
            data: {
                email,
                importerID,
                password,
            },
            fields: {
                mapping: customFields.mapping.value,
                importAddress: customFields.importAddress.value,
                importLabel: customFields.importLabel.value,
                importPeriod: customFields.importPeriod.value,
                importCategoriesDestination: customFields.importCategoriesDestination.value,
            },
            updatedFields: {
                updatedLabel: customFields.importLabel.isUpdated,
                updatedPeriod: customFields.importPeriod.isUpdated,
                updatedMapping: customFields.mapping.isUpdated,
            },
        });

        if (connectingToProvider) {
            return;
        }

        void dispatch(startImapMailImport(payload));
    };

    return {
        email,
        errors: mailMappingErrors.errors,
        fields,
        handleCancel,
        handleReset,
        handleSubmit,
        handleSubmitCustomizeModal,
        handleUpdateField,
        hasErrors,
        hasUpdatedField: Object.values(customFields).some(({ isUpdated }) => isUpdated),
        isLabelMapping,
        isConnectingToProvider: !!connectingToProvider,
        importSize,
        selectedFolders,
        hasCategories,
    };
};

export default useStepPrepare;
