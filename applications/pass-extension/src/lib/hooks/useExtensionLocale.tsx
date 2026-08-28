import { type FC, type PropsWithChildren, useEffect } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';

import { WorkerMessageType } from '../../types/messages';
import { ExtensionContext } from '../context/extension-context';
import { matchExtensionMessage } from '../message/utils';

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
