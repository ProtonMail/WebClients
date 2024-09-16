import type { Dispatch, SetStateAction } from 'react';
import { useCallback } from 'react';

import { useModalTwo } from '@proton/components';
import { useApi, useFolders, useNotifications } from '@proton/components/hooks';
import { useGetLabels } from '@proton/components/hooks/useCategories';
import { TelemetryMailSelectAllEvents } from '@proton/shared/lib/api/telemetry';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash';

import MoveAllModal from 'proton-mail/components/list/select-all/modals/MoveAllModal';
import SelectAllMoveModal from 'proton-mail/components/list/select-all/modals/SelectAllMoveModal';
import { isMessage as testIsMessage } from 'proton-mail/helpers/elements';
import { isCustomLabel } from 'proton-mail/helpers/labels';
import {
    getCleanedFolderID,
    getNotificationTextUnauthorized,
    sendSelectAllTelemetryReport,
} from 'proton-mail/helpers/moveToFolder';
import { getSelectAllNotificationText } from 'proton-mail/helpers/selectAll';
import { useOptimisticApplyLabels } from 'proton-mail/hooks/optimistic/useOptimisticApplyLabels';
import type { Element } from 'proton-mail/models/element';
import { backendActionStarted, moveAll } from 'proton-mail/store/elements/elementsActions';
import { elementsMap as elementsMapSelector } from 'proton-mail/store/elements/elementsSelectors';
import { useMailDispatch, useMailStore } from 'proton-mail/store/hooks';
import { layoutActions } from 'proton-mail/store/layout/layoutSlice';

const { INBOX } = MAILBOX_LABEL_IDS;

export enum MoveAllType {
    moveAll,
    selectAll,
}

interface MoveAllParams {
    type: MoveAllType.moveAll;
    sourceLabelID: string;
    destinationLabelID: string;
    telemetryEvent: TelemetryMailSelectAllEvents;
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
    const [folders = []] = useFolders();
    const { createNotification } = useNotifications();
    const dispatch = useMailDispatch();
    const store = useMailStore();
    const optimisticApplyLabels = useOptimisticApplyLabels();
    const canUseOptimistic = useFlag('SelectAllOptimistic');
    const getLabels = useGetLabels();

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

        const state = store.getState();
        const elements = Object.values(elementsMapSelector(state));
        const isMessage = testIsMessage(elements[0]);

        const labels = (await getLabels()) || [];

        // We are applying the select all updates optimistically. However, new load request would cancel the optimistic updates.
        // Here we are adding a new pending action to the store to prevent loading elements from useElement hook.
        // Once the request is done, we do know what are the Task running in the labelID
        // We then can remove the pending action, and block new load requests for the time we have Task running inside a label
        dispatch(backendActionStarted());
        let rollback;
        if (canUseOptimistic) {
            rollback = optimisticApplyLabels(
                elements,
                { [destinationLabelID]: true },
                true,
                [],
                // We need to pass a "real" folder to perform optimistic on custom labels
                isCustomLabel(sourceLabelID, labels) ? INBOX : sourceLabelID
            );
        }

        void dispatch(moveAll({ SourceLabelID: sourceLabelID, DestinationLabelID: destinationLabelID, rollback }));

        createNotification({
            text: getSelectAllNotificationText(isMessage),
        });
    };

    const selectAllCallback = useCallback(
        async ({ sourceLabelID, destinationLabelID, authorizedToMove, isMessage, onCheckAll }: SelectAllParams) => {
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
        },
        [canUseOptimistic]
    );

    const moveAllCallback = useCallback(
        async ({ sourceLabelID, destinationLabelID, telemetryEvent }: MoveAllParams) => {
            await handleMoveAllMoveModal({
                destinationLabelID,
            });

            void handleMoveAllToFolder({
                sourceLabelID,
                destinationLabelID,
                telemetryEvent,
            });
        },
        [canUseOptimistic]
    );

    // Depending on the case, we want to launch a select all or a move all
    // Both actions have the same result, however, we do not have the same data and
    // there are some additional actions to perform with the select all (e.g. unselect all items)
    const moveAllToFolder = useCallback(
        async (args: MoveAllToFolderArgs) => {
            const { type } = args;

            if (type === MoveAllType.selectAll) {
                await selectAllCallback(args as SelectAllParams);
            } else if (type === MoveAllType.moveAll) {
                await moveAllCallback(args as MoveAllParams);
            }
        },
        [moveAllCallback, selectAllCallback]
    );

    return { moveAllToFolder, selectAllMoveModal, moveAllModal };
};
