import { useCallback } from 'react';

import { useModalTwo } from '@proton/components/components';
import { useApi, useFolders, useNotifications } from '@proton/components/hooks';
import { TelemetryMailSelectAllEvents } from '@proton/shared/lib/api/telemetry';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import SelectAllMarkModal from 'proton-mail/components/list/select-all/modals/SelectAllMarkModal';
import { getCleanedFolderID, sendSelectAllTelemetryReport } from 'proton-mail/helpers/moveToFolder';
import { getSelectAllNotificationText } from 'proton-mail/helpers/selectAll';
import { markAll } from 'proton-mail/logic/elements/elementsActions';
import { useAppDispatch } from 'proton-mail/logic/store';

interface MarkAllParams {
    isMessage: boolean;
    labelID?: string;
    status: MARK_AS_STATUS;
}

/**
 * If you need to use mark as on a full location, prefer to use the hook "useMarkAs" with selectAll to true instead.
 */
export const useMarkAllAs = () => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [folders = []] = useFolders();
    const dispatch = useAppDispatch();

    const [selectAllMarkModal, handleShowSelectAllMarkModal] = useModalTwo(SelectAllMarkModal);

    const markAllAs = useCallback(async ({ isMessage, labelID = '', status }: MarkAllParams) => {
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

        void dispatch(markAll({ SourceLabelID: labelID, status }));

        createNotification({
            text: getSelectAllNotificationText(isMessage),
        });
    }, []);

    return { markAllAs, selectAllMarkModal };
};
