import type { FC, PropsWithChildren } from 'react';

import { Portal } from '@proton/components/components/portal';
import ModalsChildren from '@proton/components/containers/modals/Children';
import ModalsProvider from '@proton/components/containers/modals/Provider';
import NotificationsChildren from '@proton/components/containers/notifications/Children';
import NotificationsProvider from '@proton/components/containers/notifications/Provider';
// InlineIcons because it's difficult to dynamically load assets in the extension, and the ProtonIconsTreeShakePlugin optimizes it
import InlineIcons from '@proton/icons/InlineIcons';

import type { ExtensionCoreProps } from './ExtensionCore';
import { ExtensionCore } from './ExtensionCore';

export const ExtensionRoot: FC<PropsWithChildren<ExtensionCoreProps>> = ({ children, ...props }) => (
    <ExtensionCore {...props}>
        <InlineIcons />
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
