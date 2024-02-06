import type { Dispatch, SetStateAction } from 'react';
import { useCallback } from 'react';

import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

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
}

export const useMoveToFolder = (setContainFocus?: Dispatch<SetStateAction<boolean>>) => {
    const { moveSelectionToFolder, moveToSpamModal, moveSnoozedModal, moveScheduledModal } =
        useMoveSelectionToFolder(setContainFocus);
    const { moveAllToFolder, selectAllMoveModal } = useMoveAllToFolder(setContainFocus);

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
                });
            }
        },
        [moveAllToFolder, moveSelectionToFolder]
    );

    return { moveToFolder, moveScheduledModal, moveSnoozedModal, moveToSpamModal, selectAllMoveModal };
};
