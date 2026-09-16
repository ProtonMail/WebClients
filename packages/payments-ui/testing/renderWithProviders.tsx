import type { PropsWithChildren, ReactElement } from 'react';

import type { RenderOptions } from '@testing-library/react';
import { render as originalRender } from '@testing-library/react';

import { applyHOCs } from './hocs/helpers';
import { withApi } from './hocs/with-api';
import { withCache } from './hocs/with-cache';
import { withConfig } from './hocs/with-config';
import { withMemoryRouter } from './hocs/with-memory-router';
import { withNotifications } from './hocs/with-notifications';
import { getPreloadedState, withReduxStore } from './hocs/with-redux-store';
import { setupStore } from './store';

interface StoreWrapperOptions {
    preloadedState?: Partial<Parameters<typeof setupStore>[0]['preloadedState']>;
    initialUrl?: string;
}

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'>, StoreWrapperOptions {}

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
        withMemoryRouter(initialUrl ? [initialUrl] : undefined)
    );

    // The wrapped component is built once, outside Wrapper's render. Rebuilding it per render would hand
    // React a new component type every time and remount the whole subtree, wiping state on every rerender.
    const ChildrenWithProviders = applyProviders(({ children }: PropsWithChildren<{}>) => <>{children}</>);

    function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
        return <ChildrenWithProviders>{children}</ChildrenWithProviders>;
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
