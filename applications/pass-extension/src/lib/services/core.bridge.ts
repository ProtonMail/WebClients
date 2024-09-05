import type { PassCoreMethod, PassCoreParams, PassCoreResult, PassCoreService } from '@proton/pass/lib/core/types';
import { type MessageWithSenderFactory, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { WorkerMessageType } from '@proton/pass/types';

export const createCoreServiceBridge = (messageFactory: MessageWithSenderFactory): PassCoreService => ({
    exec: async <T extends PassCoreMethod>(method: T, ...args: PassCoreParams<T>) => {
        const res = await sendMessage(
            messageFactory({
                type: WorkerMessageType.PASS_CORE_RPC,
                payload: { method, args },
            })
        );

        if (res.type === 'error') throw new Error(res.error);
        return res.result as PassCoreResult<T>;
    },
});
