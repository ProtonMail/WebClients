import type { FC, PropsWithChildren } from 'react';

import { Portal } from '@proton/atoms/Portal/Portal';
import ModalsChildren from '@proton/components/containers/modals/Children';
import ModalsProvider from '@proton/components/containers/modals/Provider';
import NotificationsChildren from '@proton/components/containers/notifications/Children';
import NotificationsProvider from '@proton/components/containers/notifications/Provider';

import type { ExtensionCoreProps } from './ExtensionCore';
import { ExtensionCore } from './ExtensionCore';

export const ExtensionRoot: FC<PropsWithChildren<ExtensionCoreProps>> = ({ children, ...props }) => (
    <ExtensionCore {...props}>
        <NotificationsProvider>
            <ModalsProvider>
                {children}
                <Portal>
                    <ModalsChildren />
                    <NotificationsChildren />
                </Portal>
            </ModalsProvider>
        </NotificationsProvider>
    </ExtensionCore>
);
