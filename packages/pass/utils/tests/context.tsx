import type { FC, PropsWithChildren } from 'react';
import { Router } from 'react-router-dom';

import { createMemoryHistory } from 'history';

import NotificationsProvider from '@proton/components/containers/notifications/Provider';
import { NavigationProvider } from '@proton/pass/components/Navigation/NavigationProvider';
import { ClipboardProvider } from '@proton/pass/components/Settings/Clipboard/ClipboardProvider';
import { UpsellingProvider } from '@proton/pass/components/Upsell/UpsellingProvider';
import { TestCoreProvider } from '@proton/pass/utils/tests/TestCoreProvider';
import { TestStoreProvider } from '@proton/pass/utils/tests/TestStoreProvider';

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
                            <UpsellingProvider>
                                <ClipboardProvider>{children}</ClipboardProvider>
                            </UpsellingProvider>
                        </TestStoreProvider>
                    </NavigationProvider>
                </Router>
            </NotificationsProvider>
        </TestCoreProvider>
    );
};
