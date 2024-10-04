import { useState } from 'react';

import { useApi, useEventManager } from '@proton/components';
import { useNotifications } from '@proton/components/hooks';
import { snoozeConversations, unsnoozeConversations } from '@proton/shared/lib/api/conversations';
import { MAILBOX_IDENTIFIERS, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';

import { getSnoozeNotificationText, getSnoozeUnixTime } from '../../helpers/snooze';
import type { Element } from '../../models/element';
import { backendActionFinished, backendActionStarted } from '../../store/elements/elementsActions';
import { params } from '../../store/elements/elementsSelectors';
import { useOptimisticApplyLabels } from '../optimistic/useOptimisticApplyLabels';

export type SNOOZE_DURATION = 'tomorrow' | 'later' | 'weekend' | 'nextweek' | 'custom';
type SnoozeState = 'snooze-selection' | 'custom-snooze';

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

    const isInbox = labelID === MAILBOX_IDENTIFIERS.inbox;
    const isSnoozed = labelID === MAILBOX_LABEL_IDS.SNOOZED;
    const canSnooze = isInbox && conversationMode;
    const canUnsnooze = isSnoozed && conversationMode;

    const proceedSnoozeUnsnooze = async (elements: Element[], snooze: boolean, data?: SnoozeProps) => {
        const conversationIDs = elements.map(({ ID }) => ID);
        const snoozeText = getSnoozeNotificationText(snooze, elements.length);

        let rollback = () => {};
        try {
            stop();
            dispatch(backendActionStarted());
            rollback = optimisticApplyLabels(elements, { [MAILBOX_LABEL_IDS.SNOOZED]: snooze }, true);

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

    const snooze = async (data: SnoozeProps) => {
        await proceedSnoozeUnsnooze(data.elements, true, data);
    };

    const unsnooze = async (elements: Element[]) => {
        await proceedSnoozeUnsnooze(elements, false);
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
