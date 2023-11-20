import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ErrorButton, Prompt, useApi, useFolders, useModalState } from '@proton/components';
import { TelemetryMailSelectAllEvents } from '@proton/shared/lib/api/telemetry';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { getCleanedFolderID, sendSelectAllTelemetryReport } from 'proton-mail/helpers/moveToFolder';

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
    const [folders = []] = useFolders();
    const api = useApi();

    const dispatch = useAppDispatch();

    const [modalProps, setModalOpen] = useModalState();
    const [actionProps, setActionProps] = useState<{ SourceLabelID: string; DestinationLabelID: string }>({
        SourceLabelID: '',
        DestinationLabelID: MAILBOX_LABEL_IDS.TRASH,
    });

    const handleSubmit = async () => {
        // We want to see how much and how the Move all feature is used
        // For that, we need to know from where the user performed the action
        // However custom folders have a unique ID, so we return "custom_folder" instead
        const { SourceLabelID } = actionProps;
        const cleanedSourceLabelID = getCleanedFolderID(SourceLabelID, folders);

        void sendSelectAllTelemetryReport({
            api,
            sourceLabelID: cleanedSourceLabelID,
            event: TelemetryMailSelectAllEvents.notification_move_to,
        });

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
