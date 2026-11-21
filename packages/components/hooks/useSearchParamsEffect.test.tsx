import type { ReactNode } from 'react';
import { Router } from 'react-router';

import { act, renderHook } from '@testing-library/react';
import { type LocationListener, createMemoryHistory } from 'history';

import useSearchParamsEffect from './useSearchParamsEffect';

describe('useSearchParamsEffect', () => {
    it('handles an action once when a render still carries the replaced search params', () => {
        const history = createMemoryHistory({ initialEntries: ['/recovery?id=1&action=recover'] });
        // Hold back location updates, as when the router renders after another update
        const pendingUpdates: (() => void)[] = [];
        const laggingHistory = new Proxy(history, {
            get: (target, property) =>
                property === 'listen'
                    ? (listener: LocationListener) =>
                          target.listen((...args) => {
                              pendingUpdates.push(() => listener(...args));
                          })
                    : Reflect.get(target, property),
        });
        const onAction = vi.fn();

        const { rerender } = renderHook(
            ({ version }) =>
                useSearchParamsEffect(
                    (params) => {
                        if (params.get('action') === 'recover') {
                            onAction(params.get('id'));
                            params.delete('action');
                            return params;
                        }
                    },
                    [version]
                ),
            {
                initialProps: { version: 1 },
                wrapper: ({ children }: { children: ReactNode }) => (
                    <Router history={laggingHistory}>{children}</Router>
                ),
            }
        );

        rerender({ version: 2 });
        act(() => pendingUpdates.forEach((update) => update()));

        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenCalledWith('1');
        expect(history.location.search).toBe('?id=1');
    });
});
