import { useMemo } from 'react';

import { useActivityProbe } from '@proton/pass/hooks/useActivityProbe';
import { type MessageWithSenderFactory, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { WorkerMessageType } from '@proton/pass/types';

export const useExtensionActivityProbe = (messageFactory: MessageWithSenderFactory) => {
    const probe = useActivityProbe();
    return useMemo(
        () => ({
            start: () =>
                probe.start(
                    () =>
                        sendMessage(
                            messageFactory({
                                type: WorkerMessageType.AUTH_CHECK,
                                payload: { immediate: false },
                            })
                        ),
                    5_000
                ),
            cancel: probe.cancel,
        }),
        []
    );
};
