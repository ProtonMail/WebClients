import type { PropsWithChildren, ReactElement, ReactNode } from 'react';
import * as React from 'react';
import { Router } from 'react-router';
import { Route } from 'react-router-dom';

import type { RenderResult as OriginalRenderResult } from '@testing-library/react';
import { render as originalRender } from '@testing-library/react';
import type { MemoryHistory } from 'history';
import { createMemoryHistory } from 'history';

import { ApiContext, CacheProvider, ConfigProvider, ModalsChildren, ModalsProvider } from '@proton/components';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { registerFeatureFlagsApiMock } from '@proton/testing/lib/features';

import type { EOOriginalMessageOptions } from 'proton-mail/helpers/test/eo/helpers';
import { EOInitStore, validID } from 'proton-mail/helpers/test/eo/helpers';
import { init } from 'proton-mail/store/eo/eoActions';

import { EO_REDIRECT_PATH } from '../../../constants';
import { setupStore } from '../../../store/eo/eoStore';
import { api, mockDomApi } from '../api';
import { mockCache } from '../cache';
import NotificationsTestProvider from '../notifications';
import { config, tick } from '../render';

interface RenderResult extends OriginalRenderResult {
    rerender: (ui: ReactNode) => Promise<void>;
    history: MemoryHistory;
}

interface Props {
    children: ReactNode;
    routePath?: string;
    history: MemoryHistory;
}

const EOTestProvider = ({ children, routePath = EO_REDIRECT_PATH, history }: Props) => {
    return (
        <ConfigProvider config={config}>
            <ApiContext.Provider value={api}>
                <NotificationsTestProvider>
                    <ModalsProvider>
                        <CacheProvider cache={mockCache}>
                            <ModalsChildren />
                            <Router history={history}>
                                <Route path={routePath}>{children}</Route>
                            </Router>
                        </CacheProvider>
                    </ModalsProvider>
                </NotificationsTestProvider>
            </ApiContext.Provider>
        </ConfigProvider>
    );
};

export const getStoreWrapper = () => {
    const store = setupStore();

    function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
        return <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>;
    }

    return { Wrapper, store };
};

export const EORender = async (
    ui: ReactElement,
    {
        routePath,
        initialRoute,
        options,
        initialEntries = ['/eo'],
        invalid = false,
    }: {
        routePath?: string;
        options?: EOOriginalMessageOptions;
        initialRoute?: string;
        initialEntries?: string[];
        invalid?: boolean;
    }
): Promise<RenderResult> => {
    mockDomApi();
    registerFeatureFlagsApiMock();

    const { Wrapper, store } = getStoreWrapper();

    if (initialRoute) {
        initialEntries = [`/eo/${initialRoute}/${validID}`];
    }
    await store.dispatch(init({ get: jest.fn() }));
    if (!invalid) {
        await EOInitStore({ options, store });
    }

    const history = createMemoryHistory({ initialEntries });

    const result = originalRender(
        <Wrapper>
            <EOTestProvider routePath={routePath} history={history}>
                {ui}
            </EOTestProvider>
        </Wrapper>
    );
    await tick(); // Should not be necessary, would be better not to use it, but fails without

    const rerender = async (ui: ReactNode) => {
        result.rerender(
            <Wrapper>
                <EOTestProvider routePath={routePath} history={history}>
                    {ui}
                </EOTestProvider>
            </Wrapper>
        );
        await tick(); // Should not be necessary, would be better not to use it, but fails without
    };

    const unmount = () => {
        // Unmounting the component not the whole context
        result.rerender(
            <Wrapper>
                <EOTestProvider routePath={routePath} history={history}>
                    {null}
                </EOTestProvider>
            </Wrapper>
        );
        return true;
    };

    return { ...result, rerender, unmount, history };
};
