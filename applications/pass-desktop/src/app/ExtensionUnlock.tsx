import { type FC, type ReactNode, useEffect } from 'react';

import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { respondToDesktopLockMessage } from '@proton/pass/lib/auth/lock/desktop/logic.desktop';
import { clientReady } from '@proton/pass/lib/client';
import { listenNativeMessage } from '@proton/pass/lib/native-messaging/native-messaging.desktop';
import { NativeMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

const log = (...content: any[]) => logger.debug('[ExtensionUnlock]', ...content);

type Props = { children: ReactNode };

/** Deals with unlock requests from the extension trhough the native messaging channel.
 * It has to be a React component to be able to have a state and access app state.
 * It can't be just a hook because we need to be inside the component tree to access providers. */
export const ExtensionUnlock: FC<Props> = ({ children }) => {
    const { status } = useAppState();

    const isReady = clientReady(status);

    useEffect(() => {
        return listenNativeMessage(NativeMessageType.SETUP_LOCK_SECRET, isReady, (request, messageId) => {
            log('setup lock request');
            void respondToDesktopLockMessage(request, messageId).catch(noop);
        });
    }, [isReady]);

    return children;
};
