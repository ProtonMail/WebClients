import { useActivityProbe } from '@proton/pass/hooks/useActivityProbe';
import { type MessageWithSenderFactory, sendMessage } from '@proton/pass/lib/extension/message';
import { WorkerMessageType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const useExtensionActivityProbe = (messageFactory: MessageWithSenderFactory) =>
    useActivityProbe(() => {
        sendMessage(
            messageFactory({
                type: WorkerMessageType.AUTH_CHECK,
                payload: { immediate: false },
            })
        ).catch(noop);
    });
