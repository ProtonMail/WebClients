import type { FC, PropsWithChildren } from 'react';
import { Router } from 'react-router-dom';

import type { MemoryHistory } from 'history';
import type { SagaMiddleware } from 'redux-saga';

import ModalsChildren from '@proton/components/containers/modals/Children';
import ModalsProvider from '@proton/components/containers/modals/Provider';
import NotificationsChildren from '@proton/components/containers/notifications/Children';
import NotificationsProvider from '@proton/components/containers/notifications/Provider';

import { ContextMenuProvider } from '../../components/ContextMenu/ContextMenuProvider';
import { AppStateProvider } from '../../components/Core/AppStateProvider';
import { AuthStoreProvider } from '../../components/Core/AuthStoreProvider';
import { FolderActionsProvider } from '../../components/Folders/FolderActionsProvider';
import { InviteProvider } from '../../components/Invite/InviteProvider';
import { NavigationProvider } from '../../components/Navigation/NavigationProvider';
import { ClipboardProvider } from '../../components/Settings/Clipboard/ClipboardProvider';
import { UpsellingProvider } from '../../components/Upsell/UpsellingProvider';
import { VaultActionsProvider } from '../../components/Vault/VaultActionsProvider';
import type { AuthStore } from '../../lib/auth/store';
import type { TestCoreOverrides } from './TestCoreProvider';
import { TestCoreProvider } from './TestCoreProvider';
import type { TestStore } from './TestStoreProvider';
import { TestStoreProvider } from './TestStoreProvider';
import { mockAppStyles, mockLayout } from './layout';

mockLayout();
mockAppStyles();

type Props = PropsWithChildren<{
    authStore: AuthStore;
    core?: TestCoreOverrides;
    history: MemoryHistory;
    store: TestStore;
    sagaMiddleware: SagaMiddleware;
}>;

export const TestContext: FC<Props> = ({ authStore, core, history, store, sagaMiddleware, children }) => (
    <TestCoreProvider overrides={core}>
        <NotificationsProvider>
            <ModalsProvider>
                <Router history={history}>
                    <NavigationProvider>
                        <AuthStoreProvider store={authStore}>
                            <AppStateProvider>
                                <TestStoreProvider store={store} sagaMiddleware={sagaMiddleware}>
                                    <ContextMenuProvider>
                                        <VaultActionsProvider>
                                            <FolderActionsProvider>
                                                <InviteProvider>
                                                    <UpsellingProvider>
                                                        <ClipboardProvider>
                                                            {children}
                                                            <ModalsChildren />
                                                            <NotificationsChildren />
                                                        </ClipboardProvider>
                                                    </UpsellingProvider>
                                                </InviteProvider>
                                            </FolderActionsProvider>
                                        </VaultActionsProvider>
                                    </ContextMenuProvider>
                                </TestStoreProvider>
                            </AppStateProvider>
                        </AuthStoreProvider>
                    </NavigationProvider>
                </Router>
            </ModalsProvider>
        </NotificationsProvider>
    </TestCoreProvider>
);
