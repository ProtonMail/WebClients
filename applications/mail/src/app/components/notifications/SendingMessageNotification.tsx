import React, { useState, useRef, useLayoutEffect } from 'react';
import { c } from 'ttag';
import createListeners from 'proton-shared/lib/helpers/listeners';
import { wait } from 'proton-shared/lib/helpers/promise';
import { useIsMounted } from 'react-components';
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
}

enum SendingStep {
    sending,
    sent,
    sentWithUndo,
}

const SendingMessageNotification = ({ manager }: SendingMessageNotificationProps) => {
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
        return <>{c('Info').t`Message sent`}</>;
    }

    const onUndo = onUndoRef.current;

    if (state === SendingStep.sentWithUndo && onUndo) {
        return (
            <>
                <span className="mr1">{c('Info').t`Message sent`}</span>
                <UndoButton onUndo={onUndo} />
            </>
        );
    }

    return <>{c('Info').t`Sending message...`}</>;
};

export default SendingMessageNotification;
