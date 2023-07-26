import { useRef } from 'react';

import type { MessageWithSenderFactory } from '@proton/pass/extension/message';
import { sendMessage } from '@proton/pass/extension/message';
import { WorkerMessageType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export type ActivityProbe = ReturnType<typeof createActivityProbe>;

const ACTIVITY_PROBE_TIMEOUT = 5_000;

const createActivityProbe = (messageFactory: MessageWithSenderFactory) => {
    const timer: { interval?: NodeJS.Timer } = {};

    const cancel = () => clearInterval(timer?.interval);
    const ping = () => sendMessage(messageFactory({ type: WorkerMessageType.ACTIVITY_PROBE })).catch(noop);

    const start = () => {
        cancel();
        timer.interval = setInterval(ping, ACTIVITY_PROBE_TIMEOUT);
        void ping();
    };

    return { start, cancel };
};

export const useActivityProbe = (messageFactory: MessageWithSenderFactory): ActivityProbe =>
    useRef(createActivityProbe(messageFactory)).current;
