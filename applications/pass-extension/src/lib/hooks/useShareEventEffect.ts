import { useEffect } from 'react';

import type { WorkerMessageWithSender } from '@proton/pass/types';
import { ShareEventType, WorkerMessageType } from '@proton/pass/types';

import { ExtensionContext } from '../context/extension-context';

type UseShareServerEventHookOptions = {
    listen?: boolean;
    onShareDisabled: (shareId: string) => void;
    onItemsDeleted?: (shareId: string, itemIds: string[]) => void;
};

export const useShareEventEffect = (options: UseShareServerEventHookOptions) => {
    useEffect(() => {
        if (options?.listen === false) return;

        const { port } = ExtensionContext.get();

        const handleShareServerEvent = (message: WorkerMessageWithSender) => {
            if (message.sender === 'background' && message.type === WorkerMessageType.SHARE_SERVER_EVENT) {
                const { payload } = message;

                switch (payload.type) {
                    case ShareEventType.SHARE_DISABLED: {
                        return options.onShareDisabled(payload.shareId);
                    }

                    case ShareEventType.ITEMS_DELETED: {
                        const { shareId, itemIds } = payload;
                        return options.onItemsDeleted?.(shareId, itemIds);
                    }
                }
            }
        };

        port.onMessage.addListener(handleShareServerEvent);
        return () => port.onMessage.removeListener(handleShareServerEvent);
    }, [options]);
};
