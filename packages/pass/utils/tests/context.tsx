import type { FC, PropsWithChildren } from 'react';
import { Router } from 'react-router-dom';

import { createMemoryHistory } from 'history';

import NotificationsProvider from '@proton/components/containers/notifications/Provider';

import { InviteProvider } from '../../components/Invite/InviteProvider';
import { NavigationProvider } from '../../components/Navigation/NavigationProvider';
import { ClipboardProvider } from '../../components/Settings/Clipboard/ClipboardProvider';
import { UpsellingProvider } from '../../components/Upsell/UpsellingProvider';
import { VaultActionsProvider } from '../../components/Vault/VaultActionsProvider';
import { TestCoreProvider } from './TestCoreProvider';
import { TestStoreProvider } from './TestStoreProvider';

const history = createMemoryHistory();

window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

export const TestContext: FC<PropsWithChildren> = ({ children }) => {
    return (
        <TestCoreProvider>
            <NotificationsProvider>
                <Router history={history}>
                    <NavigationProvider>
                        <TestStoreProvider>
                            <VaultActionsProvider>
                                <InviteProvider>
                                    <UpsellingProvider>
                                        <ClipboardProvider>{children}</ClipboardProvider>
                                    </UpsellingProvider>
                                </InviteProvider>
                            </VaultActionsProvider>
                        </TestStoreProvider>
                    </NavigationProvider>
                </Router>
            </NotificationsProvider>
        </TestCoreProvider>
    );
};
