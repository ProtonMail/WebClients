import { useMemo } from 'react';

import { useActivityProbe } from '@proton/pass/hooks/useActivityProbe';
import { sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { WorkerMessageType } from '@proton/pass/types';

import { useEndpointMessage } from './useEndpointMessage';

export const useExtensionActivityProbe = () => {
    const probe = useActivityProbe();
    const message = useEndpointMessage();

    return useMemo(
        () => ({
            start: () =>
                probe.start(
                    () =>
                        sendMessage(
                            message({
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
