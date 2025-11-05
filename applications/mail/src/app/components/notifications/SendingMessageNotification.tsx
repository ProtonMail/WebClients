import { useLayoutEffect, useRef, useState } from 'react';

import { isToday, isTomorrow } from 'date-fns';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import useIsMounted from '@proton/hooks/useIsMounted';
import createListeners from '@proton/shared/lib/helpers/listeners';
import { wait } from '@proton/shared/lib/helpers/promise';

import { formatDateToHuman } from '../../helpers/date';
import { isScheduledSendTodayMorning } from '../composer/actions/scheduleSend/helpers';
import UndoNotificationButton from './UndoNotificationButton';

export const createSendingMessageNotificationManager = () => {
    const listeners = createListeners();
    return {
        ID: -1,
        setProperties: (promise: Promise<any>, onUndo?: () => Promise<void>) => {
            listeners.notify(promise, onUndo);
        },
        ...listeners,
    };
};
export type SendingMessageNotificationManager = ReturnType<typeof createSendingMessageNotificationManager>;

interface SendingMessageNotificationProps {
    manager: SendingMessageNotificationManager;
    scheduledAt?: number;
}

enum SendingStep {
    sending,
    sent,
    sentWithUndo,
}

const SendingMessageNotification = ({ manager, scheduledAt }: SendingMessageNotificationProps) => {
    const [state, setState] = useState(SendingStep.sending);
    const onUndoRef = useRef<() => Promise<void> | undefined>();
    const isMounted = useIsMounted();

    const getScheduledNotification = (scheduledAt: number, onUndo: (() => Promise<void> | undefined) | undefined) => {
        const scheduleDate = scheduledAt * 1000;
        const { dateString, formattedTime } = formatDateToHuman(scheduleDate);

        const getNotificationText = () => {
            if (isScheduledSendTodayMorning(scheduledAt)) {
                /*
                 * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
                 * Full sentence for reference: "Message will be sent in the morning at 11:00 AM"
                 */
                return c('Info').t`Message will be sent in the morning at ${formattedTime}`;
            }

            if (isToday(scheduleDate)) {
                /*
                 * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
                 * Full sentence for reference: "Message will be sent today at 12:30 PM"
                 */
                return c('Info').t`Message will be sent today at ${formattedTime}`;
            }

            if (isTomorrow(scheduleDate)) {
                /*
                 * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
                 * Full sentence for reference: "Message will be sent tomorrow at 12:30 PM"
                 */
                return c('Info').t`Message will be sent tomorrow at ${formattedTime}`;
            }

            /*
             * translator: The variables here are the following.
             * ${dateString} can be "on Tuesday, May 11" for example
             * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
             * Full sentence for reference: "Message will be sent on Tuesday, May 11 at 12:30 PM"
             */
            return c('Info').t`Message will be sent on ${dateString} at ${formattedTime}`;
        };

        const notification = getNotificationText();

        return (
            <>
                <span>{notification}</span>
                {onUndo && <UndoNotificationButton className="mr-4" onUndo={onUndo} />}
            </>
        );
    };

    useLayoutEffect(() => {
        return manager.subscribe(async (promise: Promise<any>, onUndo: () => Promise<void>) => {
            onUndoRef.current = onUndo;
            const { undoTimeout } = await promise;
            if (isMounted()) {
                setState(undoTimeout ? SendingStep.sentWithUndo : SendingStep.sent);
            }
            if (undoTimeout) {
                await wait(undoTimeout);
                if (isMounted()) {
                    setState(SendingStep.sent);
                }
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-94B93B
    }, []);

    if (state === SendingStep.sent) {
        return <>{scheduledAt ? getScheduledNotification(scheduledAt, undefined) : c('Info').t`Message sent`}</>;
    }

    const onUndo = onUndoRef.current;

    if (state === SendingStep.sentWithUndo && onUndo) {
        if (scheduledAt) {
            return getScheduledNotification(scheduledAt, onUndo);
        }
        return (
            <>
                <span>{c('Info').t`Message sent.`}</span>
                <UndoNotificationButton onUndo={onUndo} />
            </>
        );
    }

    return (
        <>
            {scheduledAt ? c('Info').t`Scheduling message` : c('Info').t`Sending message`} <CircleLoader />
        </>
    );
};

export default SendingMessageNotification;
