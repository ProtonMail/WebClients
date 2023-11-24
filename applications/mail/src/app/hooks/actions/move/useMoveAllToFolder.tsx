import { Dispatch, SetStateAction, useCallback } from 'react';

import { useModalTwo } from '@proton/components/components';
import { useApi, useFolders, useLabels, useNotifications } from '@proton/components/hooks';
import { TelemetryMailSelectAllEvents } from '@proton/shared/lib/api/telemetry';

import SelectAllMoveModal from 'proton-mail/components/list/select-all/modals/SelectAllMoveModal';
import {
    getCleanedFolderID,
    getNotificationTextUnauthorized,
    sendSelectAllTelemetryReport,
} from 'proton-mail/helpers/moveToFolder';
import { getSelectAllNotificationText } from 'proton-mail/helpers/selectAll';
import { moveAll } from 'proton-mail/logic/elements/elementsActions';
import { useAppDispatch } from 'proton-mail/logic/store';
import { Element } from 'proton-mail/models/element';

interface MoveAllParams {
    fromLabelID: string;
    folderID: string;
    destinationLabelID: string;
    authorizedToMove: Element[];
    isMessage: boolean;
}

/**
 * If you need to use move on a full location, prefer to use the hook "useMoveToFolder" with selectAll to true instead.
 */
export const useMoveAllToFolder = (setContainFocus?: Dispatch<SetStateAction<boolean>>) => {
    const api = useApi();
    const [folders = []] = useFolders();
    const [labels = []] = useLabels();
    const { createNotification } = useNotifications();
    const dispatch = useAppDispatch();

    const [selectAllMoveModal, handleShowSelectAllMoveModal] = useModalTwo(SelectAllMoveModal);

    const moveAllToFolder = useCallback(
        async ({ fromLabelID, folderID, destinationLabelID, authorizedToMove, isMessage }: MoveAllParams) => {
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

            void dispatch(moveAll({ SourceLabelID: fromLabelID, DestinationLabelID: folderID, selectAll: true }));

            createNotification({
                text: getSelectAllNotificationText(isMessage),
            });
        },
        [labels]
    );

    return { moveAllToFolder, selectAllMoveModal };
};
