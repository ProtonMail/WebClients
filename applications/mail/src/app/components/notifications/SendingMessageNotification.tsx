import React, { useState, useRef, useLayoutEffect } from 'react';
import { c } from 'ttag';
import { format, isToday, isTomorrow } from 'date-fns';
import createListeners from '@proton/shared/lib/helpers/listeners';
import { wait } from '@proton/shared/lib/helpers/promise';
import { AppLink, useIsMounted } from '@proton/components';
import UndoButton from './UndoButton';

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
    messageID?: string;
}

enum SendingStep {
    sending,
    sent,
    sentWithUndo,
}

const SendingMessageNotification = ({ manager, scheduledAt, messageID }: SendingMessageNotificationProps) => {
    const [state, setState] = useState(SendingStep.sending);
    const onUndoRef = useRef<() => Promise<void> | undefined>();
    const isMounted = useIsMounted();

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
    }, []);

    if (state === SendingStep.sent) {
        return <>{scheduledAt ? c('Info').t`Message scheduled` : c('Info').t`Message sent`}</>;
    }

    const onUndo = onUndoRef.current;

    if (state === SendingStep.sentWithUndo && onUndo) {
        if (scheduledAt) {
            const scheduleDate = scheduledAt * 1000;

            const formattedDate = format(scheduleDate, 'EEEE, iii d');
            const formattedTime = format(scheduleDate, 'p');

            // translator: This segment is part of a longer sentence which looks like this "Message will be sent on Tuesday, May 11 at 12:30 PM"
            let dateString = c('Date label').t`on ${formattedDate}`;

            if (isToday(scheduleDate)) {
                dateString = c('Date label').t`Today`;
            }

            if (isTomorrow(scheduleDate)) {
                dateString = c('Date label').t`Tomorrow`;
            }

            /*
             * translator: The variables here are the following.
             * ${dateString} can be either "on Tuesday, May 11", for example, or "Today" or "Tomorrow"
             * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
             * Full sentence for reference: "Message will be sent on Tuesday, May 11 at 12:30 PM"
             */
            const notification = c('Info').t`Message will be sent ${dateString} at ${formattedTime}`;

            return (
                <>
                    <span className="mr1">{notification}</span>
                    <UndoButton className="mr1" onUndo={onUndo} />
                    <AppLink to={`/scheduled/${messageID}`}>{c('Action').t`View message`}</AppLink>
                </>
            );
        }
        return (
            <>
                <span className="mr1">{c('Info').t`Message sent`}</span>
                <UndoButton onUndo={onUndo} />
            </>
        );
    }

    return <>{scheduledAt ? c('Info').t`Scheduling message...` : c('Info').t`Sending message...`}</>;
};

export default SendingMessageNotification;
