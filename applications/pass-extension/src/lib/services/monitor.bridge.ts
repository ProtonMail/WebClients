import { type MessageWithSenderFactory, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { MonitorService } from '@proton/pass/lib/monitor/service';

export const createMonitorBridge = (messageFactory: MessageWithSenderFactory): MonitorService => ({
    checkMissing2FAs: (payload) =>
        sendMessage.on(messageFactory({ type: WorkerMessageType.MONITOR_2FAS, payload }), (res) =>
            res.type === 'success' ? res.result : []
        ),

    checkWeakPasswords: (payload) =>
        sendMessage.on(messageFactory({ type: WorkerMessageType.MONITOR_WEAK_PASSWORDS, payload }), (res) =>
            res.type === 'success' ? res.result : []
        ),
});
