import { Dispatch, SetStateAction, useCallback } from 'react';

import { useModalTwo } from '@proton/components/components';
import { useApi, useFolders, useNotifications } from '@proton/components/hooks';
import { TelemetryMailSelectAllEvents } from '@proton/shared/lib/api/telemetry';

import SelectAllLabelModal from 'proton-mail/components/list/select-all/modals/SelectAllLabelModal';
import { getSortedChanges } from 'proton-mail/helpers/labels';
import { getCleanedFolderID, sendSelectAllTelemetryReport } from 'proton-mail/helpers/moveToFolder';
import { getSelectAllNotificationText } from 'proton-mail/helpers/selectAll';
import { useOptimisticApplyLabels } from 'proton-mail/hooks/optimistic/useOptimisticApplyLabels';
import { backendActionStarted, labelAll } from 'proton-mail/logic/elements/elementsActions';
import { elementsMap as elementsMapSelector } from 'proton-mail/logic/elements/elementsSelectors';
import { store, useAppDispatch } from 'proton-mail/logic/store';

interface ApplyLabelsToAllParams {
    changes: { [labelID: string]: boolean };
    fromLabelID: string;
    isMessage: boolean;
}

/**
 * If you need to use apply label on a full location, prefer to use the hook "useApplyLabel" with selectAll to true instead.
 */
export const useApplyLabelsToAll = (setContainFocus?: Dispatch<SetStateAction<boolean>>) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [folders = []] = useFolders();
    const dispatch = useAppDispatch();
    const optimisticApplyLabels = useOptimisticApplyLabels();

    const [applyLabelsToAllModal, handleShowApplyLabelsToAllModal] = useModalTwo(SelectAllLabelModal);

    const applyLabelsToAll = useCallback(async ({ changes, fromLabelID, isMessage }: ApplyLabelsToAllParams) => {
        const sortedChanges = getSortedChanges(changes);

        setContainFocus?.(false);
        await handleShowApplyLabelsToAllModal({
            labelID: fromLabelID,
            isMessage: isMessage,
            toLabel: sortedChanges.toLabel,
            toUnlabel: sortedChanges.toUnlabel,
            onCloseCustomAction: () => setContainFocus?.(true),
        });

        // Send Telemetry
        const cleanedSourceLabelID = getCleanedFolderID(fromLabelID, folders);
        void sendSelectAllTelemetryReport({
            api,
            sourceLabelID: cleanedSourceLabelID,
            event: TelemetryMailSelectAllEvents.banner_label_as,
        });

        const state = store.getState();
        const elements = Object.values(elementsMapSelector(state));

        // We are applying the select all updates optimistically. However, new load request would cancel the optimistic updates.
        // Here we are adding a new pending action to the store to prevent loading elements from useElement hook.
        // Once the request is done, we do know what are the Task running in the labelID
        // We then can remove the pending action, and block new load requests for the time we have Task running inside a label
        dispatch(backendActionStarted());
        const rollback = optimisticApplyLabels(elements, changes);

        void dispatch(
            labelAll({
                SourceLabelID: fromLabelID,
                toLabel: sortedChanges.toLabel,
                toUnlabel: sortedChanges.toUnlabel,
                rollback,
            })
        );

        createNotification({
            text: getSelectAllNotificationText(isMessage),
        });
    }, []);

    return { applyLabelsToAll, applyLabelsToAllModal };
};
