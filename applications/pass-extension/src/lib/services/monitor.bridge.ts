import { type MessageWithSenderFactory, sendMessage } from '@proton/pass/lib/extension/message';
import type { MonitorServiceBridge } from '@proton/pass/lib/monitor/service';
import { WorkerMessageType } from '@proton/pass/types';

export const createMonitorBridge = (messageFactory: MessageWithSenderFactory): MonitorServiceBridge => ({
    analyzePassword: (password) =>
        sendMessage.on(
            messageFactory({
                type: WorkerMessageType.MONITOR_PASSWORD,
                payload: { password },
            }),
            (res) => (res.type === 'success' ? res.result : null)
        ),

    checkMissing2FAs: () =>
        sendMessage.on(messageFactory({ type: WorkerMessageType.MONITOR_2FAS }), (res) =>
            res.type === 'success' ? res.result : []
        ),

    checkWeakPasswords: () =>
        sendMessage.on(messageFactory({ type: WorkerMessageType.MONITOR_WEAK_PASSWORDS }), (res) =>
            res.type === 'success' ? res.result : []
        ),

    domain2FAEligible: () => {
        throw new Error('Not implemented');
    },
});
