import { useCallback } from 'react';
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
    useFolders,
} from '@proton/components';
import { emptyLabel as emptyLabelRequest } from '@proton/shared/lib/api/messages';

import { useOptimisticEmptyLabel } from './optimistic/useOptimisticEmptyLabel';
import { isCustomLabel } from '../helpers/labels';

export const useEmptyLabel = () => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();
    const optimisticEmptyLabel = useOptimisticEmptyLabel();
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();

    const emptyLabel = useCallback(
        async (labelID: string) => {
            const isLabel = isCustomLabel(labelID, labels);
            await new Promise((resolve, reject) => {
                createModal(
                    <ConfirmModal
                        title={c('Title').t`Delete all messages`}
                        confirm={
                            <ErrorButton type="submit" data-testid="confirm-empty-folder">
                                {c('Action').t`Delete`}
                            </ErrorButton>
                        }
                        onConfirm={() => resolve(undefined)}
                        onClose={reject}
                    >
                        <Alert type="info">
                            {isLabel
                                ? c('Info').t`All messages stored with this label will be permanently deleted.`
                                : c('Info').t`All messages stored in this folder will be permanently deleted.`}
                        </Alert>
                        <Alert type="error">
                            {isLabel
                                ? c('Info').t`Are you sure you want to delete all messages with this label?`
                                : c('Info').t`Are you sure you want to delete all messages in this folder?`}
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
        },
        [labels, folders]
    );

    return emptyLabel;
};
