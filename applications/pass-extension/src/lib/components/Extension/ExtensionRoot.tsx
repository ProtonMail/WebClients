import { type FC, type ReactNode } from 'react';

import { ModalsChildren, ModalsProvider, NotificationsChildren, NotificationsProvider } from '@proton/components';
import { Portal } from '@proton/components/components/portal';
import Icons from '@proton/icons/Icons';
import type { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { type ClientEndpoint } from '@proton/pass/types';

import { ExtensionCore } from './ExtensionCore';

type Props = {
    endpoint: ClientEndpoint;
    children: ReactNode;
    theme?: PassThemeOption;
};

export const ExtensionRoot: FC<Props> = ({ endpoint, children, theme }) => (
    <ExtensionCore endpoint={endpoint} theme={theme}>
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
