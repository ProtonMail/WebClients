import { ReactElement, ReactNode } from 'react';
import * as React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { Router } from 'react-router';
import { Route } from 'react-router-dom';

import { RenderResult as OriginalRenderResult, render as originalRender } from '@testing-library/react';
import { MemoryHistory, createMemoryHistory } from 'history';

import {
    CacheProvider,
    ConfigProvider,
    ExperimentsProvider,
    FeaturesProvider,
    ModalsChildren,
    ModalsProvider,
} from '@proton/components';
import ApiContext from '@proton/components/containers/api/apiContext';

import { EO_REDIRECT_PATH } from '../../../constants';
import { store } from '../../../logic/eo/eoStore';
import { api, mockDomApi, registerFeatureFlagsApiMock } from '../api';
import { cache } from '../cache';
import NotificationsTestProvider from '../notifications';
import { config, tick } from '../render';

interface RenderResult extends OriginalRenderResult {
    rerender: (ui: React.ReactElement) => Promise<void>;
}

let history: MemoryHistory;
export const EOGetHistory = () => history;
export const EOResetHistory = (initialEntries: string[] = ['/eo']) => {
    history = createMemoryHistory({ initialEntries });
};
EOResetHistory();

interface Props {
    children: ReactNode;
    routePath?: string;
}

const EOTestProvider = ({ children, routePath = EO_REDIRECT_PATH }: Props) => {
    return (
        <ConfigProvider config={config}>
            <ApiContext.Provider value={api}>
                <NotificationsTestProvider>
                    <ModalsProvider>
                        <CacheProvider cache={cache}>
                            <ModalsChildren />
                            <ReduxProvider store={store}>
                                <FeaturesProvider>
                                    <ExperimentsProvider>
                                        <Router history={history}>
                                            <Route path={routePath}>{children}</Route>
                                        </Router>
                                    </ExperimentsProvider>
                                </FeaturesProvider>
                            </ReduxProvider>
                        </CacheProvider>
                    </ModalsProvider>
                </NotificationsTestProvider>
            </ApiContext.Provider>
        </ConfigProvider>
    );
};

export const EORender = async (ui: ReactElement, routePath?: string): Promise<RenderResult> => {
    mockDomApi();
    registerFeatureFlagsApiMock();

    const result = originalRender(<EOTestProvider routePath={routePath}>{ui}</EOTestProvider>);
    await tick(); // Should not be necessary, would be better not to use it, but fails without

    const rerender = async (ui: ReactElement) => {
        result.rerender(<EOTestProvider routePath={routePath}>{ui}</EOTestProvider>);
        await tick(); // Should not be necessary, would be better not to use it, but fails without
    };

    const unmount = () => {
        // Unmounting the component not the whole context
        result.rerender(<EOTestProvider routePath={routePath}>{null}</EOTestProvider>);
        return true;
    };

    return { ...result, rerender, unmount };
};
