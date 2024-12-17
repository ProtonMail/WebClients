import type { Dispatch, SetStateAction } from 'react';
import { useCallback } from 'react';

import { useFolders, useLabels } from '@proton/mail';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import useListTelemetry, {
    ACTION_TYPE,
    type SOURCE_ACTION,
    folderLocation,
    getActionFromLabel,
    numberSelectionElements,
} from 'proton-mail/components/list/useListTelemetry';
import { MoveAllType, useMoveAllToFolder } from 'proton-mail/hooks/actions/move/useMoveAllToFolder';
import { useMoveSelectionToFolder } from 'proton-mail/hooks/actions/move/useMoveSelectionToFolder';

import { isMessage as testIsMessage } from '../../../helpers/elements';
import { getMessagesAuthorizedToMove } from '../../../helpers/message/messages';
import type { Element } from '../../../models/element';

export interface MoveParams {
    elements: Element[];
    destinationLabelID: string;
    folderName: string;
    sourceLabelID: string;
    createFilters?: boolean;
    silent?: boolean;
    askUnsub?: boolean;
    selectAll?: boolean;
    onCheckAll?: (check: boolean) => void;
    sourceAction: SOURCE_ACTION;
    currentFolder: string;
    percentUnread?: number;
}

export const useMoveToFolder = (setContainFocus?: Dispatch<SetStateAction<boolean>>) => {
    const { moveSelectionToFolder, moveToSpamModal, moveSnoozedModal, moveScheduledModal } =
        useMoveSelectionToFolder(setContainFocus);
    const { moveAllToFolder, selectAllMoveModal } = useMoveAllToFolder(setContainFocus);
    const { sendSimpleActionReport } = useListTelemetry();
    const [folders] = useFolders();
    const [labels] = useLabels();

    const moveToFolder = useCallback(
        async ({
            elements,
            destinationLabelID,
            folderName,
            sourceLabelID,
            createFilters = false,
            silent = false,
            askUnsub = true,
            selectAll,
            onCheckAll,
            sourceAction,
            currentFolder,
            percentUnread,
        }: MoveParams) => {
            if (!elements.length) {
                return;
            }

            const isMessage = testIsMessage(elements[0]);

            const authorizedToMove = isMessage
                ? getMessagesAuthorizedToMove(elements as Message[], destinationLabelID)
                : elements;

            if (selectAll) {
                await moveAllToFolder({
                    type: MoveAllType.selectAll,
                    sourceLabelID,
                    authorizedToMove,
                    destinationLabelID,
                    isMessage,
                    onCheckAll,
                });
            } else {
                const destinationFolder = folderLocation(destinationLabelID, labels, folders);

                sendSimpleActionReport({
                    actionType:
                        destinationFolder === 'CUSTOM_FOLDER'
                            ? ACTION_TYPE.MOVE_TO_CUSTOM_FOLDER
                            : getActionFromLabel(destinationLabelID),
                    actionLocation: sourceAction,
                    numberMessage: numberSelectionElements(elements.length),
                    destination: destinationFolder,
                    folderLocation: currentFolder,
                    percentUnread: percentUnread,
                });
                await moveSelectionToFolder({
                    elements,
                    sourceLabelID,
                    folderName,
                    destinationLabelID,
                    createFilters,
                    silent,
                    askUnsub,
                    isMessage,
                    authorizedToMove,
                    sourceAction,
                    currentFolder,
                });
            }
        },
        [moveAllToFolder, moveSelectionToFolder]
    );

    return { moveToFolder, moveScheduledModal, moveSnoozedModal, moveToSpamModal, selectAllMoveModal };
};
