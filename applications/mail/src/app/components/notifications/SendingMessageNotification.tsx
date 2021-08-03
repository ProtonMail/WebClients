import { useState, useRef, useLayoutEffect } from 'react';
import { c } from 'ttag';
import createListeners from '@proton/shared/lib/helpers/listeners';
import { wait } from '@proton/shared/lib/helpers/promise';
import { AppLink, useIsMounted } from '@proton/components';
import { VIEW_MODE } from '@proton/shared/lib/constants';
import UndoButton from './UndoButton';
import { formatScheduledDate } from '../../helpers/date';
import { MessageCache } from '../../containers/MessageProvider';

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
    localID: string;
    messageCache: MessageCache;
    viewMode: number;
}

enum SendingStep {
    sending,
    sent,
    sentWithUndo,
}

const SendingMessageNotification = ({
    manager,
    scheduledAt,
    localID,
    messageCache,
    viewMode,
}: SendingMessageNotificationProps) => {
    const [state, setState] = useState(SendingStep.sending);
    const onUndoRef = useRef<() => Promise<void> | undefined>();
    const isMounted = useIsMounted();

    const getScheduledNotification = (scheduledAt: number, onUndo: (() => Promise<void> | undefined) | undefined) => {
        const scheduleDate = scheduledAt * 1000;

        const { dateString, formattedTime } = formatScheduledDate(scheduleDate);

        /*
         * translator: The variables here are the following.
         * ${dateString} can be either "on Tuesday, May 11", for example, or "today" or "tomorrow"
         * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
         * Full sentence for reference: "Message will be sent on Tuesday, May 11 at 12:30 PM"
         */
        const notification = c('Info').t`Message will be sent ${dateString} at ${formattedTime}`;

        const linkID =
            viewMode === VIEW_MODE.GROUP
                ? messageCache.get(localID)?.data?.ConversationID
                : messageCache.get(localID)?.data?.ID;

        return (
            <>
                <span className="mr1">{notification}</span>
                {onUndo && <UndoButton className="mr1" onUndo={onUndo} />}
                <AppLink to={`/scheduled/${linkID}`}>{c('Action').t`View message`}</AppLink>
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
                <span className="mr1">{c('Info').t`Message sent`}</span>
                <UndoButton onUndo={onUndo} />
            </>
        );
    }

    return <>{scheduledAt ? c('Info').t`Scheduling message...` : c('Info').t`Sending message...`}</>;
};

export default SendingMessageNotification;
