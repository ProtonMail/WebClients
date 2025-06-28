import { type FC, type PropsWithChildren, useEffect } from 'react';

import { ExtensionContext } from 'proton-pass-extension/lib/context/extension-context';
import { matchExtensionMessage } from 'proton-pass-extension/lib/message/utils';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';

export const useExtensionLocale = () => {
    const core = usePassCore();
    const context = ExtensionContext.read();

    useEffect(() => {
        if (!context) return;

        const watchLocale = (message: unknown) => {
            if (matchExtensionMessage(message, { type: WorkerMessageType.LOCALE_UPDATED })) {
                const nextLocale = message.payload.locale;
                void core.i18n.setLocale(nextLocale);
            }
        };

        context.port.onMessage.addListener(watchLocale);
        return () => context.port.onMessage.removeListener(watchLocale);
    }, [context]);
};

export const WithExtensionLocale: FC<PropsWithChildren> = ({ children }) => {
    useExtensionLocale();
    return children;
};
