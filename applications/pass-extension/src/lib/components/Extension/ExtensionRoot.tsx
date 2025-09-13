import type { FC, PropsWithChildren } from 'react';

import { ModalsChildren, ModalsProvider, NotificationsChildren, NotificationsProvider } from '@proton/components';
import { Portal } from '@proton/components/components/portal';
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
