import { useApi, useNotifications } from '@proton/components';
import { useFolders } from '@proton/mail';
import { TelemetryMailSelectAllEvents } from '@proton/shared/lib/api/telemetry';

import { isMessage as testIsMessage } from 'proton-mail/helpers/elements';
import { getCleanedFolderID, sendSelectAllTelemetryReport } from 'proton-mail/helpers/moveToFolder';
import { getSelectAllNotificationText } from 'proton-mail/helpers/selectAll';
import { useEmptyLabel } from 'proton-mail/hooks/actions/useEmptyLabel';
import { useGetElementsFromIDs } from 'proton-mail/hooks/mailbox/useElements';
import { useMailDispatch } from 'proton-mail/store/hooks';
import { layoutActions } from 'proton-mail/store/layout/layoutSlice';

/**
 * If you need to use permanent delete on a full location, prefer to use the hook "usePermanentDelete" with selectAll to true instead.
 */
export const usePermanentDeleteAll = (labelID: string) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const getElementsFromIDs = useGetElementsFromIDs();
    const [folders = []] = useFolders();
    const { emptyLabel, modal: deleteAllModal } = useEmptyLabel();
    const dispatch = useMailDispatch();

    const handleDeleteAll = async (selectedIDs: string[]) => {
        const elements = getElementsFromIDs(selectedIDs);
        const isMessage = testIsMessage(elements[0]);
        // Send Telemetry
        const cleanedSourceLabelID = getCleanedFolderID(labelID, folders);
        void sendSelectAllTelemetryReport({
            api,
            sourceLabelID: cleanedSourceLabelID,
            event: TelemetryMailSelectAllEvents.banner_permanent_delete,
        });

        await emptyLabel(labelID);

        createNotification({
            text: getSelectAllNotificationText(isMessage),
        });
        dispatch(layoutActions.setSelectAll(false));
    };

    return { handleDeleteAll, deleteAllModal };
};
