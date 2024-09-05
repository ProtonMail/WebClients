import { type MessageWithSenderFactory, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import type { MonitorService } from '@proton/pass/lib/monitor/service';
import { WorkerMessageType } from '@proton/pass/types';

export const createMonitorBridge = (messageFactory: MessageWithSenderFactory): MonitorService => ({
    checkMissing2FAs: () =>
        sendMessage.on(messageFactory({ type: WorkerMessageType.MONITOR_2FAS }), (res) =>
            res.type === 'success' ? res.result : []
        ),

    checkWeakPasswords: () =>
        sendMessage.on(messageFactory({ type: WorkerMessageType.MONITOR_WEAK_PASSWORDS }), (res) =>
            res.type === 'success' ? res.result : []
        ),
});
