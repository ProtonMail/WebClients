import { Dispatch, SetStateAction, useCallback } from 'react';

import { useModalTwo } from '@proton/components/components';
import { useApi, useFolders, useNotifications } from '@proton/components/hooks';
import { TelemetryMailSelectAllEvents } from '@proton/shared/lib/api/telemetry';

import SelectAllMoveModal from 'proton-mail/components/list/select-all/modals/SelectAllMoveModal';
import {
    getCleanedFolderID,
    getNotificationTextUnauthorized,
    sendSelectAllTelemetryReport,
} from 'proton-mail/helpers/moveToFolder';
import { getSelectAllNotificationText } from 'proton-mail/helpers/selectAll';
import { useOptimisticApplyLabels } from 'proton-mail/hooks/optimistic/useOptimisticApplyLabels';
import { backendActionStarted, moveAll } from 'proton-mail/logic/elements/elementsActions';
import { elementsMap as elementsMapSelector } from 'proton-mail/logic/elements/elementsSelectors';
import { layoutActions } from 'proton-mail/logic/layout/layoutSlice';
import { store, useAppDispatch } from 'proton-mail/logic/store';
import { Element } from 'proton-mail/models/element';

interface MoveAllParams {
    fromLabelID: string;
    folderID: string;
    destinationLabelID: string;
    authorizedToMove: Element[];
    isMessage: boolean;
    onCheckAll?: (check: boolean) => void;
}

/**
 * If you need to use move on a full location, prefer to use the hook "useMoveToFolder" with selectAll to true instead.
 */
export const useMoveAllToFolder = (setContainFocus?: Dispatch<SetStateAction<boolean>>) => {
    const api = useApi();
    const [folders = []] = useFolders();
    const { createNotification } = useNotifications();
    const dispatch = useAppDispatch();
    const optimisticApplyLabels = useOptimisticApplyLabels();

    const [selectAllMoveModal, handleShowSelectAllMoveModal] = useModalTwo(SelectAllMoveModal);

    const moveAllToFolder = useCallback(
        async ({
            fromLabelID,
            folderID,
            destinationLabelID,
            authorizedToMove,
            isMessage,
            onCheckAll,
        }: MoveAllParams) => {
            if (!authorizedToMove.length) {
                createNotification({
                    text: getNotificationTextUnauthorized(folderID, destinationLabelID),
                    type: 'error',
                });
                return;
            }

            setContainFocus?.(false);
            await handleShowSelectAllMoveModal({
                labelID: fromLabelID,
                isMessage: isMessage,
                destinationID: folderID,
                onCloseCustomAction: () => setContainFocus?.(true),
            });

            // Send Telemetry
            const cleanedSourceLabelID = getCleanedFolderID(fromLabelID, folders);
            void sendSelectAllTelemetryReport({
                api,
                sourceLabelID: cleanedSourceLabelID,
                event: TelemetryMailSelectAllEvents.banner_move_to,
            });

            const state = store.getState();
            const elements = Object.values(elementsMapSelector(state));

            // We are applying the select all updates optimistically. However, new load request would cancel the optimistic updates.
            // Here we are adding a new pending action to the store to prevent loading elements from useElement hook.
            // Once the request is done, we do know what are the Task running in the labelID
            // We then can remove the pending action, and block new load requests for the time we have Task running inside a label
            dispatch(backendActionStarted());
            const rollback = optimisticApplyLabels(elements, { [folderID]: true }, true, [], destinationLabelID);

            void dispatch(
                moveAll({ SourceLabelID: fromLabelID, DestinationLabelID: folderID, selectAll: true, rollback })
            );

            // Clear elements selection
            onCheckAll?.(false);

            createNotification({
                text: getSelectAllNotificationText(isMessage),
            });

            dispatch(layoutActions.setSelectAll(false));
        },
        []
    );

    return { moveAllToFolder, selectAllMoveModal };
};
