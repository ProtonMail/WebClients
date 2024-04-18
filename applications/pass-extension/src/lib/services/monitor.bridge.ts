import type { MonitorService } from 'proton-pass-extension/app/worker/services/monitor';

import { type MessageWithSenderFactory, sendMessage } from '@proton/pass/lib/extension/message';
import { WorkerMessageType } from '@proton/pass/types';

export const createMonitorBridge = (messageFactory: MessageWithSenderFactory): MonitorService => ({
    analyzePassword: (password) =>
        sendMessage.on(
            messageFactory({
                type: WorkerMessageType.MONITOR_PASSWORD,
                payload: { password },
            }),
            (res) => (res.type === 'success' ? res.result : null)
        ),

    checkMissing2FAs: (items) =>
        sendMessage.on(
            messageFactory({
                type: WorkerMessageType.MONITOR_2FAS,
                payload: { items },
            }),
            (res) => (res.type === 'success' ? res.result : [])
        ),

    domain2FAEligible: () => {
        throw new Error('Not implemented');
    },
});
