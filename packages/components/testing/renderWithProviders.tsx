import type { PropsWithChildren, ReactElement } from 'react';

import type { RenderOptions } from '@testing-library/react';
import { render as originalRender } from '@testing-library/react';

import { withApi } from '@proton/testing/lib/context/hocs/with-api';
import { withMemoryRouter } from '@proton/testing/lib/context/hocs/with-memory-router';

import { applyHOCs } from './hocs/helpers';
import { setupStore } from './store';
import { withAuthentication } from './with-authentication';
import { withCache } from './with-cache';
import { withConfig } from './with-config';
import { withEventManager } from './with-event-manager';
import { withNotifications } from './with-notifications';
import { getPreloadedState, withReduxStore } from './with-redux-store';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
    preloadedState?: Partial<Parameters<typeof setupStore>[0]['preloadedState']>;
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
