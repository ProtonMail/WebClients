import React, { useCallback } from 'react';
import { c } from 'ttag';
import {
    ConfirmModal,
    ErrorButton,
    Alert,
    useNotifications,
    useModals,
    useEventManager,
    useApi,
    useLabels,
    useFolders
} from 'react-components';
import { emptyLabel as emptyLabelRequest } from 'proton-shared/lib/api/messages';

import { useOptimisticEmptyLabel } from './optimistic/useOptimisticEmptyLabel';
import { isCustomLabel, getLabelName } from '../helpers/labels';

export const useEmptyLabel = () => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();
    const optimisticEmptyLabel = useOptimisticEmptyLabel();
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();

    const emptyLabel = useCallback(async (labelID: string) => {
        const isLabel = isCustomLabel(labelID, labels);
        const labelName = getLabelName(labelID, labels, folders);
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal
                    title={c('Title').t`Empty ${labelName}`}
                    confirm={<ErrorButton type="submit">{c('Action').t`Empty`}</ErrorButton>}
                    onConfirm={resolve}
                    onClose={reject}
                >
                    <Alert type="info">
                        {isLabel
                            ? c('Info')
                                  .t`Please note that if you empty this label, you will permanently delete all the emails with this label.`
                            : c('Info')
                                  .t`Please note that if you empty this folder, you will permanently delete all the emails stored in it.`}
                    </Alert>
                    <Alert type="error">
                        {isLabel
                            ? c('Info').t`Are you sure you want to empty this label?`
                            : c('Info').t`Are you sure you want to empty this folder?`}
                    </Alert>
                </ConfirmModal>
            );
        });
        const rollback = optimisticEmptyLabel(labelID);
        try {
            await api(emptyLabelRequest({ LabelID: labelID, AddressID: undefined }));
        } catch (error) {
            rollback();
            throw error;
        }
        await call();
        createNotification({ text: isLabel ? c('Success').t`Label cleared` : c('Success').t`Folder cleared` });
    }, []);

    return emptyLabel;
};
