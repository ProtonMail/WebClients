import { Dispatch, SetStateAction, useCallback } from 'react';

import { useModalTwo } from '@proton/components/components';
import { useApi, useFolders, useNotifications } from '@proton/components/hooks';
import { TelemetryMailSelectAllEvents } from '@proton/shared/lib/api/telemetry';

import SelectAllLabelModal from 'proton-mail/components/list/select-all/modals/SelectAllLabelModal';
import { getSortedChanges } from 'proton-mail/helpers/labels';
import { getCleanedFolderID, sendSelectAllTelemetryReport } from 'proton-mail/helpers/moveToFolder';
import { getSelectAllNotificationText } from 'proton-mail/helpers/selectAll';
import { labelAll } from 'proton-mail/logic/elements/elementsActions';
import { useAppDispatch } from 'proton-mail/logic/store';

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

        void dispatch(
            labelAll({ SourceLabelID: fromLabelID, toLabel: sortedChanges.toLabel, toUnlabel: sortedChanges.toUnlabel })
        );

        createNotification({
            text: getSelectAllNotificationText(isMessage),
        });
    }, []);

    return { applyLabelsToAll, applyLabelsToAllModal };
};
