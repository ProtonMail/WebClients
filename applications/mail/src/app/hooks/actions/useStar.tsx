import { useCallback } from 'react';

import { useApi, useEventManager } from '@proton/components';
import { labelConversations, unlabelConversations } from '@proton/shared/lib/api/conversations';
import { labelMessages, unlabelMessages } from '@proton/shared/lib/api/messages';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import useListTelemetry, {
    ACTION_TYPE,
    type SOURCE_ACTION,
    numberSelectionElements,
} from 'proton-mail/components/list/useListTelemetry';
import useIsEncryptedSearch from 'proton-mail/hooks/useIsEncryptedSearch';
import { useMailDispatch } from 'proton-mail/store/hooks';

import { isMessage as testIsMessage } from '../../helpers/elements';
import type { Element } from '../../models/element';
import { backendActionFinished, backendActionStarted } from '../../store/elements/elementsActions';
import { useOptimisticApplyLabels } from '../optimistic/useOptimisticApplyLabels';
import { MOVE_BACK_ACTION_TYPES } from './moveBackAction/interfaces';
import { useMoveBackAction } from './moveBackAction/useMoveBackAction';

export const useStar = () => {
    const api = useApi();
    const { stop, start, call } = useEventManager();
    const optimisticApplyLabels = useOptimisticApplyLabels();
    const dispatch = useMailDispatch();
    const { sendSimpleActionReport } = useListTelemetry();
    const isES = useIsEncryptedSearch();

    const { handleOnBackMoveAction } = useMoveBackAction();

    const star = useCallback(
        async (elements: Element[], value: boolean, labelID: string, sourceAction: SOURCE_ACTION) => {
            if (!elements.length) {
                return;
            }

            const isMessage = testIsMessage(elements[0]);
            const labelAction = isMessage ? labelMessages : labelConversations;
            const unlabelAction = isMessage ? unlabelMessages : unlabelConversations;
            const action = value ? labelAction : unlabelAction;

            sendSimpleActionReport({
                actionType: value ? ACTION_TYPE.STAR : ACTION_TYPE.UNSTAR,
                actionLocation: sourceAction,
                numberMessage: numberSelectionElements(elements.length),
            });

            let rollback = () => {};

            try {
                // Stop the event manager to prevent race conditions
                stop();
                dispatch(backendActionStarted());

                handleOnBackMoveAction({
                    type: MOVE_BACK_ACTION_TYPES.STAR,
                    elements,
                    isUnstarringElement: !value,
                });

                rollback = optimisticApplyLabels({
                    elements,
                    inputChanges: { [MAILBOX_LABEL_IDS.STARRED]: value },
                    currentLabelID: labelID,
                    // When un-staring an item from star folder, the item should move out from the folder.
                    // To update Total optimistically correctly, we need to specify this
                    isUnstarringElement: labelID === MAILBOX_LABEL_IDS.STARRED && !value,
                });
                await api(action({ LabelID: MAILBOX_LABEL_IDS.STARRED, IDs: elements.map((element) => element.ID) }));
            } catch (error: any) {
                rollback();
                throw error;
            } finally {
                dispatch(backendActionFinished());
                start();
                // Removed to avoid state conflicts (e.g. items being moved optimistically and re-appearing directly with API data)
                // However, if on ES, because there is no optimistic in the ES cache, so we want to get api updates as soon as possible
                if (isES) {
                    await call();
                }
            }
        },
        [isES]
    );

    return star;
};
