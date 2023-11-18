import { type FC, type ReactNode, useEffect, useState } from 'react';

import { setupExtensionContext } from 'proton-pass-extension/lib/context/extension-context';

import {
    Icons,
    ModalsChildren,
    ModalsProvider,
    NotificationsChildren,
    NotificationsProvider,
} from '@proton/components';
import { Portal } from '@proton/components/components/portal';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import { resolveMessageFactory, sendMessage } from '@proton/pass/lib/extension/message';
import type { WorkerMessage } from '@proton/pass/types';
import { type ExtensionEndpoint, WorkerMessageType } from '@proton/pass/types';
import { DEFAULT_LOCALE } from '@proton/shared/lib/constants';
import { loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';
import noop from '@proton/utils/noop';

import locales from '../../../app/locales';
import { PassExtensionCore } from './PassExtensionCore';

export const ExtensionApp: FC<{
    endpoint: ExtensionEndpoint;
    children: (ready: boolean, locale: string) => ReactNode;
}> = ({ endpoint, children }) => {
    const [ready, setReady] = useState(false);
    const [locale, setLocale] = useState(DEFAULT_LOCALE);

    /* resolve the extension locale through the I18nService instead of reading
     * from the store as some extension sub-apps are not redux connected but
     * should be aware of the current localisation setting */
    const getExtensionLocale = () =>
        sendMessage.on(resolveMessageFactory(endpoint)({ type: WorkerMessageType.LOCALE_REQUEST }), (res) =>
            res.type === 'success' ? res.locale : DEFAULT_LOCALE
        );

    const watchLocale = (message: WorkerMessage) => {
        if (message.type === WorkerMessageType.SETTINGS_UPDATE) {
            const nextLocale = message.payload.locale ?? locale;
            loadLocale(nextLocale, locales)
                .then(() => setLocale(nextLocale))
                .catch(noop);
        }
    };

    useEffect(() => {
        setupExtensionContext({
            endpoint,
            onDisconnect: () => {
                window.location.reload();
                return { recycle: false };
            },
            onRecycle: noop,
        })
            .then(async (ctx) => {
                const currentLocale = await getExtensionLocale();
                setLocale(currentLocale);
                setTtagLocales(locales);

                ctx.port.onMessage.addListener(watchLocale);
                return loadLocale(currentLocale, locales);
            })
            .then(() => setReady(true))
            .catch(console.warn);
    }, []);

    return (
        <PassExtensionCore endpoint={endpoint}>
            <Icons />
            <ThemeProvider />
            <NotificationsProvider>
                <ModalsProvider>
                    {children(ready, locale)}
                    <Portal>
                        <ModalsChildren />
                        <NotificationsChildren />
                    </Portal>
                </ModalsProvider>
            </NotificationsProvider>
        </PassExtensionCore>
    );
};
