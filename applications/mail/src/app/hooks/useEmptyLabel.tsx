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
    useLabels
} from 'react-components';
import { emptyLabel as emptyLabelRequest } from 'proton-shared/lib/api/messages';

import { useOptimisticEmptyLabel } from './optimistic/useOptimisticEmptyLabel';
import { isCustomLabel } from '../helpers/labels';

export const useEmptyLabel = () => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();
    const optimisticEmptyLabel = useOptimisticEmptyLabel();
    const [labels = []] = useLabels();

    const emptyLabel = useCallback(async (labelID: string) => {
        const isLabel = isCustomLabel(labelID, labels);
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal
                    title={isLabel ? c('Title').t`Empty label` : c('Title').t`Empty folder`}
                    confirm={<ErrorButton type="submit" icon={null}>{c('Action').t`Empty`}</ErrorButton>}
                    onConfirm={resolve}
                    onClose={reject}
                >
                    <Alert type="warning">
                        {isLabel
                            ? c('Info')
                                  .t`This action will permanently delete your emails. Are you sure you want to empty this label?`
                            : c('Info')
                                  .t`This action will permanently delete your emails. Are you sure you want to empty this folder?`}
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
