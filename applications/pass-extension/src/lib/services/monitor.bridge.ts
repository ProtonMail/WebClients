import type { MonitorService } from '@proton/pass/lib/monitor/service';

import { WorkerMessageType } from '../../types/messages';
import { type MessageWithSenderFactory, sendMessage } from '../message/send-message';

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
