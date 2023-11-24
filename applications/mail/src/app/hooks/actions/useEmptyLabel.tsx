import { useCallback, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ErrorButton, Prompt, useApi, useEventManager, useFolders, useLabels, useModalState } from '@proton/components';
import { emptyLabel as emptyLabelRequest } from '@proton/shared/lib/api/messages';

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
    const [deleteModalProps, setDeleteModalOpen] = useModalState();

    const isLabel = useMemo(() => {
        return isCustomLabel(labelID, labels);
    }, [labelID]);

    const handleSubmit = async () => {
        deleteModalProps.onClose();
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
    };

    const modal = (
        <Prompt
            title={c('Title').t`Delete all messages`}
            buttons={[
                <ErrorButton data-testid="confirm-empty-folder" onClick={handleSubmit}>
                    {c('Action').t`Delete`}
                </ErrorButton>,
                <Button onClick={deleteModalProps.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...deleteModalProps}
        >
            {isLabel ? (
                <>
                    {c('Info').t`All messages stored with this label will be permanently deleted.`}
                    <br />
                    {c('Info').t`Are you sure you want to delete all messages with this label?`}
                </>
            ) : (
                <>
                    {c('Info').t`All messages stored in this folder will be permanently deleted.`}
                    <br />
                    {c('Info').t`Are you sure you want to delete all messages in this folder?`}
                </>
            )}
        </Prompt>
    );

    const emptyLabel = useCallback(
        async (labelID: string) => {
            setLabelID(labelID);
            setDeleteModalOpen(true);
        },
        [labels, folders]
    );

    return { emptyLabel, modal };
};
