import type { PropsWithChildren } from 'react';
import { type FC } from 'react';

import { ModalsChildren, ModalsProvider, NotificationsChildren, NotificationsProvider } from '@proton/components';
import { Portal } from '@proton/components/components/portal';
import Icons from '@proton/icons/Icons';

import type { ExtensionCoreProps } from './ExtensionCore';
import { ExtensionCore } from './ExtensionCore';

export const ExtensionRoot: FC<PropsWithChildren<ExtensionCoreProps>> = ({ children, ...props }) => (
    <ExtensionCore {...props}>
        <Icons />
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
