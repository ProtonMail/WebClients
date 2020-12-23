import React, { useState, useEffect, useRef } from 'react';
import { c } from 'ttag';
import { useLoading } from 'react-components';
import createListeners from 'proton-shared/lib/helpers/listeners';
import { wait } from 'proton-shared/lib/helpers/promise';

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
    const [loading, withLoading] = useLoading();
    const onUndoRef = useRef<() => Promise<void> | undefined>();

    useEffect(() => {
        return manager.subscribe(async (promise: Promise<any>, onUndo: () => Promise<void>) => {
            onUndoRef.current = onUndo;
            const { undoTimeout } = await promise;
            setState(undoTimeout ? SendingStep.sentWithUndo : SendingStep.sent);
            if (undoTimeout) {
                await wait(undoTimeout);
                setState(SendingStep.sent);
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
                <UndoButton onUndo={() => withLoading(onUndo())} loading={loading} />
            </>
        );
    }

    return <>{c('Info').t`Sending message...`}</>;
};

export default SendingMessageNotification;
