import type { JSXElementConstructor, PropsWithChildren, ReactNode } from 'react';

import type { RenderHookOptions, queries } from '@testing-library/react';
import { renderHook as originalRenderHook } from '@testing-library/react';

import { applyHOCs } from './hocs/helpers';
import { withApi } from './hocs/with-api';
import { withAuthentication } from './hocs/with-authentication';
import { withCache } from './hocs/with-cache';
import { withConfig } from './hocs/with-config';
import { withEventManager } from './hocs/with-event-manager';
import { withMemoryRouter } from './hocs/with-memory-router';
import { withNotifications } from './hocs/with-notifications';
import { getPreloadedState, withReduxStore } from './hocs/with-redux-store';
import { setupStore } from './store';

interface ExtendedRenderHookOptions<Props = unknown> extends Omit<
    RenderHookOptions<Props, typeof queries, HTMLElement, HTMLElement>,
    'wrapper'
> {
    preloadedState?: Partial<Parameters<typeof setupStore>[0]['preloadedState']>;
    initialUrl?: string;
    wrapper?: JSXElementConstructor<{ children: ReactNode }>;
}

interface StoreWrapperOptions {
    preloadedState?: ExtendedRenderHookOptions['preloadedState'];
    initialUrl?: ExtendedRenderHookOptions['initialUrl'];
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

export function renderHookWithProviders<ResultType, PropsType = unknown>(
    hook: (initialProps: PropsType) => ResultType,
    options?: ExtendedRenderHookOptions<PropsType>
) {
    const { store, Wrapper } = getStoreWrapper({
        preloadedState: options?.preloadedState,
        initialUrl: options?.initialUrl,
    });

    const { initialProps, wrapper: outerWrapper, ...renderOptions } = options ?? {};
    const OuterWrapper = outerWrapper as JSXElementConstructor<{ children: ReactNode }>;

    const FinalWrapper = outerWrapper
        ? ({ children }: { children: ReactNode }) => (
              <OuterWrapper>
                  <Wrapper>{children}</Wrapper>
              </OuterWrapper>
          )
        : Wrapper;

    return {
        store,
        ...originalRenderHook(hook, {
            wrapper: FinalWrapper,
            initialProps,
            ...renderOptions,
        }),
    };
}
