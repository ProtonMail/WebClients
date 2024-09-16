import { useCallback } from 'react';

import { useModalTwo } from '@proton/components';
import { useApi, useFolders, useNotifications } from '@proton/components/hooks';
import { TelemetryMailSelectAllEvents } from '@proton/shared/lib/api/telemetry';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import { useFlag } from '@proton/unleash';

import SelectAllMarkModal from 'proton-mail/components/list/select-all/modals/SelectAllMarkModal';
import { getCleanedFolderID, sendSelectAllTelemetryReport } from 'proton-mail/helpers/moveToFolder';
import { getSelectAllNotificationText } from 'proton-mail/helpers/selectAll';
import { useOptimisticMarkAs } from 'proton-mail/hooks/optimistic/useOptimisticMarkAs';
import { backendActionStarted, markAll } from 'proton-mail/store/elements/elementsActions';
import { elementsMap as elementsMapSelector } from 'proton-mail/store/elements/elementsSelectors';
import { useMailDispatch, useMailStore } from 'proton-mail/store/hooks';
import { layoutActions } from 'proton-mail/store/layout/layoutSlice';

interface MarkAllParams {
    isMessage: boolean;
    labelID?: string;
    status: MARK_AS_STATUS;
    onCheckAll?: (check: boolean) => void;
}

/**
 * If you need to use mark as on a full location, prefer to use the hook "useMarkAs" with selectAll to true instead.
 */
export const useMarkAllAs = () => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [folders = []] = useFolders();
    const dispatch = useMailDispatch();
    const store = useMailStore();
    const optimisticMarkAs = useOptimisticMarkAs();
    const canUseOptimistic = useFlag('SelectAllOptimistic');

    const [selectAllMarkModal, handleShowSelectAllMarkModal] = useModalTwo(SelectAllMarkModal);

    const markAllAs = useCallback(
        async ({ isMessage, labelID = '', status, onCheckAll }: MarkAllParams) => {
            await handleShowSelectAllMarkModal({
                labelID,
                isMessage: isMessage,
                markAction: status,
            });

            // Send Telemetry
            const cleanedSourceLabelID = getCleanedFolderID(labelID, folders);
            void sendSelectAllTelemetryReport({
                api,
                sourceLabelID: cleanedSourceLabelID,
                event:
                    status === MARK_AS_STATUS.READ
                        ? TelemetryMailSelectAllEvents.banner_mark_as_read
                        : TelemetryMailSelectAllEvents.banner_mark_as_unread,
            });

            const state = store.getState();
            const elements = Object.values(elementsMapSelector(state));

            // We are applying the select all updates optimistically. However, new load request would cancel the optimistic updates.
            // Here we are adding a new pending action to the store to prevent loading elements from useElement hook.
            // Once the request is done, we do know what are the Task running in the labelID
            // We then can remove the pending action, and block new load requests for the time we have Task running inside a label
            dispatch(backendActionStarted());
            let rollback;

            if (canUseOptimistic) {
                rollback = optimisticMarkAs(elements, labelID, { status });
            }

            void dispatch(markAll({ SourceLabelID: labelID, status, rollback }));

            // Clear elements selection
            onCheckAll?.(false);

            createNotification({
                text: getSelectAllNotificationText(isMessage),
            });

            dispatch(layoutActions.setSelectAll(false));
        },
        [canUseOptimistic]
    );

    return { markAllAs, selectAllMarkModal };
};
