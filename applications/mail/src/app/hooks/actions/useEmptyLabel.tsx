import { useCallback, useMemo, useState } from 'react';

import { useApi, useEventManager, useModalTwo } from '@proton/components';
import { isCustomLabel } from '@proton/mail/helpers/location';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { emptyLabel as emptyLabelRequest } from '@proton/shared/lib/api/messages';

import SelectAllDeleteModal from 'proton-mail/components/list/select-all/modals/SelectAllDeleteModal';
import { useMailDispatch } from 'proton-mail/store/hooks';

import { backendActionFinished, backendActionStarted } from '../../store/elements/elementsActions';
import { useOptimisticEmptyLabel } from '../optimistic/useOptimisticEmptyLabel';

export const useEmptyLabel = () => {
    const { call } = useEventManager();
    const api = useApi();
    const optimisticEmptyLabel = useOptimisticEmptyLabel();
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const dispatch = useMailDispatch();

    const [labelID, setLabelID] = useState<string>('');
    const [deleteAllModal, handleShowDeleteAllModal] = useModalTwo(SelectAllDeleteModal);

    const isLabel = useMemo(() => {
        return isCustomLabel(labelID, labels);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-6A69C8
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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-5423F3
        [labels, folders]
    );

    return { emptyLabel, modal: deleteAllModal };
};
