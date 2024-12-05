import type { PropsWithChildren, ReactElement } from 'react';

import type { RenderOptions } from '@testing-library/react';
import { render as originalRender } from '@testing-library/react';

import { applyHOCs } from './hocs';
import {
    getPreloadedState,
    withApi,
    withAuthentication,
    withCache,
    withConfig,
    withEventManager,
    withMemoryRouter,
    withNotifications,
    withReduxStore,
} from './providers';
import { setupStore } from './store';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
    preloadedState?: Partial<Parameters<typeof setupStore>[0]['preloadedState']>;
}

export const getStoreWrapper = (preloadedState?: ExtendedRenderOptions['preloadedState']) => {
    const store = setupStore({
        preloadedState: getPreloadedState(preloadedState),
    });

    const applyProviders = applyHOCs(
        withReduxStore({ store }),
        withConfig(),
        withApi(),
        withCache(),
        withNotifications(),
        withEventManager(),
        withAuthentication(),
        withMemoryRouter()
    );

    function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
        const ChildrenWithProviders = applyProviders(() => children);
        return <ChildrenWithProviders />;
    }

    return { Wrapper, store };
};

export function renderWithProviders(
    ui: ReactElement,
    { preloadedState, ...renderOptions }: ExtendedRenderOptions = {}
) {
    const { store, Wrapper } = getStoreWrapper(preloadedState);
    return { store, ...originalRender(ui, { wrapper: Wrapper, ...renderOptions }) };
}
