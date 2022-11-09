import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { AlertModal, ErrorButton, useApi, useEventManager, useModalState } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { moveAll } from '../../logic/elements/elementsActions';
import { useAppDispatch } from '../../logic/store';

export const useMoveAll = () => {
    const api = useApi();
    const { call } = useEventManager();
    const dispatch = useAppDispatch();

    const [modalProps, setModalOpen] = useModalState();
    const [actionProps, setActionProps] = useState<{ SourceLabelID: string; DestinationLabelID: string }>({
        SourceLabelID: '',
        DestinationLabelID: MAILBOX_LABEL_IDS.TRASH,
    });

    const handleSubmit = async () => {
        dispatch(moveAll({ api, call, ...actionProps }));
        modalProps.onClose?.();
    };

    const modal = (
        <AlertModal
            title={c('Title').t`Move all messages to Trash`}
            buttons={[
                <ErrorButton data-testid="confirm-empty-folder" onClick={handleSubmit}>
                    {c('Action').t`Move`}
                </ErrorButton>,
                <Button onClick={modalProps.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...modalProps}
        >
            {c('Info').t`Are you sure you want to move all messages in this location to Trash?`}
        </AlertModal>
    );

    const moveAllCallback = useCallback((SourceLabelID: string) => {
        setActionProps({ SourceLabelID, DestinationLabelID: MAILBOX_LABEL_IDS.TRASH });
        setModalOpen(true);
    }, []);

    return { moveAll: moveAllCallback, modal };
};
