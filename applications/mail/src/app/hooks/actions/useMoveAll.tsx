import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ErrorButton, Prompt, useModalState } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { moveAll } from '../../logic/elements/elementsActions';
import { useAppDispatch } from '../../logic/store';

const getTitle = (destinationLabelID: string) => {
    switch (destinationLabelID) {
        case MAILBOX_LABEL_IDS.TRASH:
            return c('Title').t`Move all messages to Trash`;
        case MAILBOX_LABEL_IDS.ARCHIVE:
            return c('Title').t`Move all messages to Archive`;
        default:
            return '';
    }
};

const getContent = (destinationLabelID: string) => {
    switch (destinationLabelID) {
        case MAILBOX_LABEL_IDS.TRASH:
            return c('Info').t`Are you sure you want to move all messages in this location to Trash?`;
        case MAILBOX_LABEL_IDS.ARCHIVE:
            return c('Info').t`Are you sure you want to move all messages in this location to Archive?`;
        default:
            return '';
    }
};

export const useMoveAll = () => {
    const dispatch = useAppDispatch();

    const [modalProps, setModalOpen] = useModalState();
    const [actionProps, setActionProps] = useState<{ SourceLabelID: string; DestinationLabelID: string }>({
        SourceLabelID: '',
        DestinationLabelID: MAILBOX_LABEL_IDS.TRASH,
    });

    const handleSubmit = async () => {
        void dispatch(moveAll({ ...actionProps }));
        modalProps.onClose?.();
    };

    const modal = (
        <Prompt
            title={getTitle(actionProps.DestinationLabelID)}
            buttons={[
                <ErrorButton data-testid="confirm-empty-folder" onClick={handleSubmit}>
                    {c('Action').t`Move`}
                </ErrorButton>,
                <Button onClick={modalProps.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...modalProps}
        >
            {getContent(actionProps.DestinationLabelID)}
        </Prompt>
    );

    const moveAllCallback = useCallback((SourceLabelID: string, DestinationLabelID: string) => {
        setActionProps({ SourceLabelID, DestinationLabelID });
        setModalOpen(true);
    }, []);

    return { moveAll: moveAllCallback, modal };
};
