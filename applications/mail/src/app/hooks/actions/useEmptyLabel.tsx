import { useCallback, useMemo, useState } from 'react';

import { useApi, useEventManager, useFolders, useLabels, useModalTwo } from '@proton/components';
import { emptyLabel as emptyLabelRequest } from '@proton/shared/lib/api/messages';

import SelectAllDeleteModal from 'proton-mail/components/list/select-all/modals/SelectAllDeleteModal';

import { isCustomLabel } from '../../helpers/labels';
import { backendActionFinished, backendActionStarted } from '../../logic/elements/elementsActions';
import { useAppDispatch } from '../../logic/store';
import { useOptimisticEmptyLabel } from '../optimistic/useOptimisticEmptyLabel';

export const useEmptyLabel = () => {
    const { call } = useEventManager();
    const api = useApi();
    const optimisticEmptyLabel = useOptimisticEmptyLabel();
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const dispatch = useAppDispatch();

    const [labelID, setLabelID] = useState<string>('');
    const [deleteAllModal, handleShowDeleteAllModal] = useModalTwo(SelectAllDeleteModal);

    const isLabel = useMemo(() => {
        return isCustomLabel(labelID, labels);
    }, [labelID]);

    const emptyLabel = useCallback(
        async (labelID: string) => {
            setLabelID(labelID);

            await handleShowDeleteAllModal({
                isLabel,
            });

            let rollback = () => {};

            try {
                dispatch(backendActionStarted());
                rollback = optimisticEmptyLabel(labelID);
                await api(emptyLabelRequest({ LabelID: labelID, AddressID: undefined }));
            } catch (error: any) {
                rollback();
                throw error;
            } finally {
                dispatch(backendActionFinished());
            }
            await call();
        },
        [labels, folders]
    );

    return { emptyLabel, modal: deleteAllModal };
};
