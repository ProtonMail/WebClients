import { type FC, type ReactNode, useEffect, useState } from 'react';

import { setupExtensionContext } from 'proton-pass-extension/lib/context/extension-context';
import { WithExtensionLocale } from 'proton-pass-extension/lib/hooks/useExtensionLocale';

import { ModalsChildren, ModalsProvider, NotificationsChildren, NotificationsProvider } from '@proton/components';
import { Portal } from '@proton/components/components/portal';
import Icons from '@proton/icons/Icons';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import { type ClientEndpoint } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { ExtensionCore } from './ExtensionCore';

type Props = {
    endpoint: ClientEndpoint;
    children: (ready: boolean) => ReactNode;
    onDisconnect?: () => void;
};

export const ExtensionApp: FC<Props> = ({ endpoint, children, onDisconnect }) => {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setupExtensionContext({
            endpoint,
            onDisconnect: () => {
                onDisconnect?.();
                return { recycle: false };
            },
            onRecycle: noop,
        })
            .then(() => setReady(true))
            .catch(noop);
    }, []);

    return (
        <ExtensionCore endpoint={endpoint}>
            <WithExtensionLocale>
                <Icons />
                <ThemeProvider />
                <NotificationsProvider>
                    <ModalsProvider>
                        {children(ready)}
                        <Portal>
                            <ModalsChildren />
                            <NotificationsChildren />
                        </Portal>
                    </ModalsProvider>
                </NotificationsProvider>
            </WithExtensionLocale>
        </ExtensionCore>
    );
};
