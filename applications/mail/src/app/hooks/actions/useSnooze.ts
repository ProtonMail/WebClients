import { useState } from 'react';

import { useApi, useEventManager, useNotifications } from '@proton/components';
import { snoozeConversations, unsnoozeConversations } from '@proton/shared/lib/api/conversations';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import type { SOURCE_ACTION } from 'proton-mail/components/list/list-telemetry/useListTelemetry';
import useListTelemetry, {
    ACTION_TYPE,
    numberSelectionElements,
} from 'proton-mail/components/list/list-telemetry/useListTelemetry';
import type { SNOOZE_DURATION, SnoozeState } from 'proton-mail/components/list/snooze/constant';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';

import { getSnoozeNotificationText, getSnoozeUnixTime } from '../../helpers/snooze';
import type { Element } from '../../models/element';
import { backendActionFinished, backendActionStarted } from '../../store/elements/elementsActions';
import { params } from '../../store/elements/elementsSelectors';
import { useOptimisticApplyLabels } from '../optimistic/useOptimisticApplyLabels';

type SnoozeProps = {
    elements: Element[];
    duration: SNOOZE_DURATION;
    snoozeTime?: Date;
};

const useSnooze = () => {
    const { labelID, conversationMode } = useMailSelector(params);

    const api = useApi();
    const { createNotification } = useNotifications();
    const { call, stop, start } = useEventManager();
    const optimisticApplyLabels = useOptimisticApplyLabels();

    const dispatch = useMailDispatch();

    const [snoozeState, setSnoozeState] = useState<SnoozeState>('snooze-selection');

    const canSnooze = labelID === MAILBOX_LABEL_IDS.INBOX && conversationMode;
    const canUnsnooze = labelID === MAILBOX_LABEL_IDS.SNOOZED && conversationMode;

    const { sendSimpleActionReport } = useListTelemetry();

    const proceedSnoozeUnsnooze = async (
        elements: Element[],
        snooze: boolean,
        sourceAction: SOURCE_ACTION,
        data?: SnoozeProps
    ) => {
        const conversationIDs = elements.map(({ ID }) => ID);
        const snoozeText = getSnoozeNotificationText(snooze, elements.length);

        sendSimpleActionReport({
            actionType: snooze ? ACTION_TYPE.SNOOZE : ACTION_TYPE.UNSNOOZE,
            actionLocation: sourceAction,
            numberMessage: numberSelectionElements(elements.length),
            destination: snooze ? 'SNOOZE' : undefined,
        });

        let rollback = () => {};
        try {
            stop();
            dispatch(backendActionStarted());
            rollback = optimisticApplyLabels({
                elements,
                inputChanges: { [MAILBOX_LABEL_IDS.SNOOZED]: snooze },
                isMove: true,
            });

            if (snooze && data) {
                const { duration, snoozeTime } = data;
                const time = duration === 'custom' ? snoozeTime : undefined;
                const snoozeUnixTime = getSnoozeUnixTime(duration, time);
                await api(snoozeConversations(conversationIDs, snoozeUnixTime));
            } else {
                await api(unsnoozeConversations(conversationIDs));
            }

            createNotification({ text: snoozeText });
        } catch (error: any) {
            rollback();
            throw error;
        } finally {
            dispatch(backendActionFinished());
            start();
            await call();
        }
    };

    const snooze = async (data: SnoozeProps, sourceAction: SOURCE_ACTION) => {
        await proceedSnoozeUnsnooze(data.elements, true, sourceAction, data);
    };

    const unsnooze = async (elements: Element[], sourceAction: SOURCE_ACTION) => {
        await proceedSnoozeUnsnooze(elements, false, sourceAction);
    };

    const handleCustomClick = () => {
        setSnoozeState('custom-snooze');
    };

    const handleClose = () => {
        setSnoozeState('snooze-selection');
    };

    return {
        canSnooze,
        canUnsnooze,
        snooze,
        unsnooze,
        handleClose,
        handleCustomClick,
        snoozeState,
    };
};

export default useSnooze;
