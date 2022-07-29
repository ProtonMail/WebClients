import { ReactElement, ReactNode, useRef } from 'react';
import * as React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { Route, Router } from 'react-router';

import { RenderResult as OriginalRenderResult, act, render as originalRender } from '@testing-library/react';
import { act as actHook, renderHook as originalRenderHook } from '@testing-library/react-hooks';
import { MemoryHistory, createMemoryHistory } from 'history';

import {
    CacheProvider,
    EventModelListener,
    ExperimentsProvider,
    ModalsChildren,
    ModalsProvider,
    PrivateAuthenticationStore,
} from '@proton/components';
import ApiContext from '@proton/components/containers/api/apiContext';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import ConfigProvider from '@proton/components/containers/config/Provider';
import FeaturesProvider from '@proton/components/containers/features/FeaturesProvider';
import { APPS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { ProtonConfig } from '@proton/shared/lib/interfaces';
import { ConversationCountsModel, MessageCountsModel } from '@proton/shared/lib/models';

import { MAIN_ROUTE_PATH } from '../../constants';
import { ComposeProvider } from '../../containers/ComposeProvider';
import EncryptedSearchProvider from '../../containers/EncryptedSearchProvider';
import { MailboxContainerContextProvider } from '../../containers/mailbox/MailboxContainerProvider';
import { MailContentRefProvider } from '../../hooks/useClickMailContent';
import { store } from '../../logic/store';
import { api, mockDomApi, registerFeatureFlagsApiMock, registerMinimalFlags } from './api';
import { cache, minimalCache } from './cache';
import NotificationsTestProvider from './notifications';

interface RenderResult extends OriginalRenderResult {
    rerender: (ui: React.ReactElement) => Promise<void>;
}

export const authentication = {
    getUID: jest.fn(),
    getLocalID: jest.fn(),
    getPassword: jest.fn(),
    onLogout: jest.fn(),
} as unknown as PrivateAuthenticationStore;

let history: MemoryHistory;
export const getHistory = () => history;
export const resetHistory = () => {
    history = createMemoryHistory({ initialEntries: ['/inbox'] });
};
resetHistory();

export const config = {
    APP_NAME: APPS.PROTONMAIL,
    APP_VERSION: 'test-version',
    DATE_VERSION: 'test-date-version',
} as ProtonConfig;

export const onCompose = jest.fn();

interface Props {
    children: ReactNode;
}

const TestProvider = ({ children }: Props) => {
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <ConfigProvider config={config}>
            <ApiContext.Provider value={api}>
                <NotificationsTestProvider>
                    <ModalsProvider>
                        <AuthenticationProvider store={authentication}>
                            <CacheProvider cache={cache}>
                                <ModalsChildren />
                                <EventModelListener models={[ConversationCountsModel, MessageCountsModel]} />
                                <ReduxProvider store={store}>
                                    <FeaturesProvider>
                                        <ExperimentsProvider>
                                            <MailContentRefProvider mailContentRef={contentRef}>
                                                <MailboxContainerContextProvider
                                                    isResizing={false}
                                                    containerRef={contentRef}
                                                    elementID={undefined}
                                                >
                                                    <ComposeProvider onCompose={onCompose}>
                                                        <Router history={history}>
                                                            <Route path={MAIN_ROUTE_PATH}>
                                                                <EncryptedSearchProvider>
                                                                    {children}
                                                                </EncryptedSearchProvider>
                                                            </Route>
                                                        </Router>
                                                    </ComposeProvider>
                                                </MailboxContainerContextProvider>
                                            </MailContentRefProvider>
                                        </ExperimentsProvider>
                                    </FeaturesProvider>
                                </ReduxProvider>
                            </CacheProvider>
                        </AuthenticationProvider>
                    </ModalsProvider>
                </NotificationsTestProvider>
            </ApiContext.Provider>
        </ConfigProvider>
    );
};

/**
 * Small helper to wait for asynchronous work to be executed
 * Should be avoided as much as possible, but often convenient
 */
export const tick = () => {
    return act(() => Promise.resolve());
};

export const render = async (ui: ReactElement, useMinimalCache = true): Promise<RenderResult> => {
    mockDomApi();
    registerFeatureFlagsApiMock();

    if (useMinimalCache) {
        minimalCache();
        registerMinimalFlags();
    }

    const result = originalRender(<TestProvider>{ui}</TestProvider>);
    await tick(); // Should not be necessary, would be better not to use it, but fails without

    const rerender = async (ui: ReactElement) => {
        result.rerender(<TestProvider>{ui}</TestProvider>);
        await tick(); // Should not be necessary, would be better not to use it, but fails without
    };

    const unmount = () => {
        // Unmounting the component not the whole context
        result.rerender(<TestProvider>{null}</TestProvider>);
        return true;
    };

    return { ...result, rerender, unmount };
};

export const renderHook = async (callback: (props: any) => any, useMinimalCache = true) => {
    registerFeatureFlagsApiMock();

    if (useMinimalCache) {
        minimalCache();
        registerMinimalFlags();
    }

    const result = originalRenderHook<any, any>(callback, { wrapper: TestProvider as any });
    await actHook(() => wait(0));
    return result;
};
