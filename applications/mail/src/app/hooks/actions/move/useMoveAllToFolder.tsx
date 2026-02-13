import type { Dispatch, SetStateAction } from 'react';

import { useApi, useModalTwo, useNotifications } from '@proton/components';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { TelemetryMailSelectAllEvents } from '@proton/shared/lib/api/telemetry';

import { folderLocation } from 'proton-mail/components/list/list-telemetry/listTelemetryHelper';
import useListTelemetry, {
    ACTION_TYPE,
    SELECTED_RANGE,
    type SOURCE_ACTION,
    getActionFromLabel,
} from 'proton-mail/components/list/list-telemetry/useListTelemetry';
import MoveAllModal from 'proton-mail/components/list/select-all/modals/MoveAllModal';
import SelectAllMoveModal from 'proton-mail/components/list/select-all/modals/SelectAllMoveModal';
import { isConversationMode } from 'proton-mail/helpers/mailSettings';
import {
    getCleanedFolderID,
    getNotificationTextUnauthorized,
    sendSelectAllTelemetryReport,
} from 'proton-mail/helpers/moveToFolder';
import { getSelectAllNotificationText } from 'proton-mail/helpers/selectAll';
import type { Element } from 'proton-mail/models/element';
import { backendActionStarted, moveAll } from 'proton-mail/store/elements/elementsActions';
import { useMailDispatch } from 'proton-mail/store/hooks';
import { layoutActions } from 'proton-mail/store/layout/layoutSlice';

export enum MoveAllType {
    moveAll,
    selectAll,
}

interface MoveAllParams {
    type: MoveAllType.moveAll;
    sourceLabelID: string;
    destinationLabelID: string;
    telemetryEvent: TelemetryMailSelectAllEvents;
    sourceAction: SOURCE_ACTION;
}

interface SelectAllParams {
    type: MoveAllType.selectAll;
    sourceLabelID: string;
    destinationLabelID: string;
    authorizedToMove: Element[];
    isMessage: boolean;
    onCheckAll?: (check: boolean) => void;
}

type MoveAllToFolderArgs = MoveAllParams | SelectAllParams;

/**
 * If you need to use move on a full location, prefer to use the hook "useMoveToFolder" with selectAll to true instead.
 */
export const useMoveAllToFolder = (setContainFocus?: Dispatch<SetStateAction<boolean>>) => {
    const api = useApi();
    const [mailSettings] = useMailSettings();
    const [folders = []] = useFolders();
    const [labels = []] = useLabels();
    const { createNotification } = useNotifications();
    const dispatch = useMailDispatch();
    const { sendSimpleActionReport } = useListTelemetry();

    const [selectAllMoveModal, handleShowSelectAllMoveModal] = useModalTwo(SelectAllMoveModal);
    const [moveAllModal, handleMoveAllMoveModal] = useModalTwo(MoveAllModal);

    const handleMoveAllToFolder = async ({
        sourceLabelID,
        destinationLabelID,
        telemetryEvent,
    }: {
        sourceLabelID: string;
        destinationLabelID: string;
        telemetryEvent: TelemetryMailSelectAllEvents;
    }) => {
        // Send Telemetry event
        const cleanedSourceLabelID = getCleanedFolderID(sourceLabelID, folders);
        void sendSelectAllTelemetryReport({
            api,
            sourceLabelID: cleanedSourceLabelID,
            event: telemetryEvent,
        });

        // We are applying the select all updates optimistically. However, new load request would cancel the optimistic updates.
        // Here we are adding a new pending action to the store to prevent loading elements from useElement hook.
        // Once the request is done, we do know what are the Task running in the labelID
        // We then can remove the pending action, and block new load requests for the time we have Task running inside a label
        dispatch(backendActionStarted());

        void dispatch(moveAll({ SourceLabelID: sourceLabelID, DestinationLabelID: destinationLabelID }));

        const isMessageMode = !isConversationMode(sourceLabelID, mailSettings);

        createNotification({
            text: getSelectAllNotificationText(isMessageMode),
        });
    };

    const selectAllCallback = async ({
        sourceLabelID,
        destinationLabelID,
        authorizedToMove,
        isMessage,
        onCheckAll,
    }: SelectAllParams) => {
        if (!authorizedToMove.length) {
            createNotification({
                text: getNotificationTextUnauthorized(destinationLabelID, sourceLabelID),
                type: 'error',
            });
            return;
        }

        setContainFocus?.(false);
        await handleShowSelectAllMoveModal({
            labelID: sourceLabelID,
            isMessage: isMessage,
            destinationID: destinationLabelID,
            onCloseCustomAction: () => setContainFocus?.(true),
        });

        void handleMoveAllToFolder({
            sourceLabelID,
            destinationLabelID,
            telemetryEvent: TelemetryMailSelectAllEvents.banner_move_to,
        });

        // Clear elements selection
        onCheckAll?.(false);

        dispatch(layoutActions.setSelectAll(false));
    };

    const moveAllCallback = async ({
        sourceLabelID,
        destinationLabelID,
        telemetryEvent,
        sourceAction,
    }: MoveAllParams) => {
        await handleMoveAllMoveModal({
            destinationLabelID,
        });

        const destinationFolder = folderLocation(destinationLabelID, labels, folders);

        sendSimpleActionReport({
            actionType:
                destinationFolder === 'CUSTOM_FOLDER'
                    ? ACTION_TYPE.MOVE_TO_CUSTOM_FOLDER
                    : getActionFromLabel(destinationLabelID),
            actionLocation: sourceAction,
            numberMessage: SELECTED_RANGE.ALL,
            destination: destinationFolder,
        });

        void handleMoveAllToFolder({
            sourceLabelID,
            destinationLabelID,
            telemetryEvent,
        });
    };

    // Depending on the case, we want to launch a select all or a move all
    // Both actions have the same result, however, we do not have the same data and
    // there are some additional actions to perform with the select all (e.g. unselect all items)
    const moveAllToFolder = async (args: MoveAllToFolderArgs) => {
        const { type } = args;

        if (type === MoveAllType.selectAll) {
            await selectAllCallback(args as SelectAllParams);
        } else if (type === MoveAllType.moveAll) {
            await moveAllCallback(args as MoveAllParams);
        }
    };

    return { moveAllToFolder, selectAllMoveModal, moveAllModal };
};
