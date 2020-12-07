import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { useLoading } from 'react-components';

import UndoButton from './UndoButton';

interface SendingMessageNotificationProps {
    promise: Promise<any>;
    onUndo?: () => Promise<void>;
}

enum SendingStep {
    sending,
    sent,
}

const SendingMessageNotification = ({ promise, onUndo }: SendingMessageNotificationProps) => {
    const [state, setState] = useState(SendingStep.sending);
    const [loading, withLoading] = useLoading();

    useEffect(() => {
        promise.then(() => {
            setState(SendingStep.sent);
        });
    }, []);

    if (state === SendingStep.sent) {
        if (onUndo) {
            return (
                <>
                    <span className="mr1">{c('Info').t`Message sent`}</span>
                    <UndoButton onUndo={() => withLoading(onUndo())} loading={loading} />
                </>
            );
        }
        return <>{c('Info').t`Message sent`}</>;
    }

    return <>{c('Info').t`Sending message...`}</>;
};

export default SendingMessageNotification;
