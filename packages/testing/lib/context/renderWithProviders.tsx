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
    // URL the MemoryRouter starts at, e.g. '/path?foo=bar', so components can read it on first render.
    initialUrl?: string;
}

interface StoreWrapperOptions {
    preloadedState?: ExtendedRenderOptions['preloadedState'];
    initialUrl?: ExtendedRenderOptions['initialUrl'];
}

export const getStoreWrapper = ({ preloadedState, initialUrl }: StoreWrapperOptions = {}) => {
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
        withMemoryRouter(initialUrl ? [initialUrl] : undefined)
    );

    function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
        const ChildrenWithProviders = applyProviders(() => children);
        return <ChildrenWithProviders />;
    }

    return { Wrapper, store };
};

export function renderWithProviders(
    ui: ReactElement,
    { preloadedState, initialUrl, ...renderOptions }: ExtendedRenderOptions = {}
) {
    const { store, Wrapper } = getStoreWrapper({ preloadedState, initialUrl });
    return { store, ...originalRender(ui, { wrapper: Wrapper, ...renderOptions }) };
}
