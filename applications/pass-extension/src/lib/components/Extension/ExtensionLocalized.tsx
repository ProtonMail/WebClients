import type { PropsWithChildren } from 'react';
import { type FC, Fragment, useEffect } from 'react';

import { ExtensionContext } from 'proton-pass-extension/lib/context/extension-context';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { WorkerMessage } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const ExtensionLocalized: FC<PropsWithChildren> = ({ children }) => {
    const core = usePassCore();
    const context = ExtensionContext.read();

    useEffect(() => {
        if (!context) return;

        const watchLocale = (message: WorkerMessage) => {
            if (message.type === WorkerMessageType.LOCALE_UPDATED) {
                const nextLocale = message.payload.locale;
                void core.i18n.setLocale(nextLocale);
            }
        };

        core.i18n
            .getLocale()
            .then((locale) => {
                void core.i18n.setLocale(locale);
                context.port.onMessage.addListener(watchLocale);
            })
            .catch(noop);

        return () => context.port.onMessage.removeListener(watchLocale);
    }, [context]);

    return <Fragment key={core.locale}>{children}</Fragment>;
};
