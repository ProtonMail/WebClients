import type { FC, ReactNode } from 'react';
import { createContext, useEffect, useRef, useState } from 'react';

import { type ExtensionContextType, setupExtensionContext } from 'proton-pass-extension/lib/context/extension-context';
import { WithExtensionLocale } from 'proton-pass-extension/lib/hooks/useExtensionLocale';
import { resolveMessageFactory, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { reloadManager } from 'proton-pass-extension/lib/utils/reload';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { type MaybeNull } from '@proton/pass/types';
import { registerLoggerEffect } from '@proton/pass/utils/logger';

type Props = { children: ReactNode; recycle?: boolean };

export const ExtensionReactContext = createContext<MaybeNull<ExtensionContextType>>(null);
export const useExtensionContext = createUseContext(ExtensionReactContext);

/** Sets up the `ExtensionContext` for an extension react app. Prefer accessing the
 * underlying context using `useExtensionContext` rather than reading it
 * from the global `ExtensionContext.get()` */
export const ExtensionSetup: FC<Props> = ({ children, recycle = false }) => {
    const [ready, setReady] = useState(false);
    const ctx = useRef<MaybeNull<ExtensionContextType>>(null);
    const { endpoint } = usePassCore();

    useEffect(() => {
        registerLoggerEffect((...logs) =>
            sendMessage(
                resolveMessageFactory(endpoint)({
                    type: WorkerMessageType.LOG_EVENT,
                    payload: { log: logs.join(' ') },
                })
            )
        );

        const setup = async () => {
            ctx.current = await setupExtensionContext({
                endpoint,
                onDisconnect: () => {
                    if (!recycle) reloadManager.appReload();
                    return { recycle };
                },
            });

            setReady(true);
        };

        void setup();
    }, []);

    return (
        <ExtensionReactContext.Provider value={ctx.current}>
            {ready && <WithExtensionLocale>{children}</WithExtensionLocale>}
        </ExtensionReactContext.Provider>
    );
};
