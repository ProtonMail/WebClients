import type { MonitorService } from '@proton/pass/lib/monitor/service';

import { WorkerMessageType } from '../../types/messages';
import { type MessageWithSenderFactory, sendMessage } from '../message/send-message';

export const createMonitorBridge = (messageFactory: MessageWithSenderFactory): MonitorService => ({
    checkMissing2FAForItem: (revision) =>
        sendMessage.on(
            messageFactory({
                type: WorkerMessageType.MONITOR_MISSING_2FA_FOR_ITEM,
                payload: { shareId: revision.shareId, itemId: revision.itemId },
            }),
            (res) => (res.type === 'success' ? res.result : false)
        ),

    checkMissing2FAs: (payload) =>
        sendMessage.on(messageFactory({ type: WorkerMessageType.MONITOR_2FAS, payload }), (res) =>
            res.type === 'success' ? res.result : []
        ),

    checkWeakPasswordForItem: (revision) =>
        sendMessage.on(
            messageFactory({
                type: WorkerMessageType.MONITOR_WEAK_PASSWORD_FOR_ITEM,
                payload: { shareId: revision.shareId, itemId: revision.itemId },
            }),
            (res) => (res.type === 'success' ? res.result : false)
        ),

    checkWeakPasswords: (payload) =>
        sendMessage.on(messageFactory({ type: WorkerMessageType.MONITOR_WEAK_PASSWORDS, payload }), (res) =>
            res.type === 'success' ? res.result : []
        ),
});
