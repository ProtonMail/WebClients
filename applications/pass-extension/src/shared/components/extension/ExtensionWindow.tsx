import { type FC, type ReactNode, useEffect, useState } from 'react';

import {
    ConfigProvider,
    Icons,
    ModalsChildren,
    ModalsProvider,
    NotificationsChildren,
    NotificationsProvider,
} from '@proton/components';
import { Portal } from '@proton/components/components/portal';
import type { ExtensionEndpoint } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

import * as config from '../../../app/config';
import { setupExtensionContext } from '../../extension/context';
import { ThemeProvider } from '../../theme/ThemeProvider';

export const ExtensionWindow: FC<{
    endpoint: ExtensionEndpoint;
    children: (ready: boolean) => ReactNode;
}> = ({ endpoint, children }) => {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setupExtensionContext({
            endpoint,
            onDisconnect: () => {
                window.location.reload();
                return { recycle: false };
            },
            onRecycle: noop,
        })
            .then(() => setReady(true))
            .catch(logger.warn);
    }, []);

    return (
        <ConfigProvider config={config}>
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
        </ConfigProvider>
    );
};
