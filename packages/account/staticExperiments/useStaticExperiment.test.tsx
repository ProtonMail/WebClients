import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { ProtonStoreProvider } from '@proton/redux-shared-store/sharedProvider';
import { getTestStore } from '@proton/redux-shared-store/test';

import { staticExperimentsActions, staticExperimentsReducer } from './slice';
import type { StaticExperimentName } from './types';
import { useStaticExperiment } from './useStaticExperiment';

const EXPERIMENT_NAME = 'MyExperiment' as StaticExperimentName;

const createWrapper = (preloadedState: Record<string, string> = {}) => {
    const { store } = getTestStore({
        reducer: staticExperimentsReducer,
        preloadedState: { staticExperiments: preloadedState },
        extraThunkArguments: {} as ProtonThunkArguments,
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
        <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>
    );

    return { store, wrapper };
};

describe('useStaticExperiment', () => {
    it('returns the resolved variant for the given experiment name', () => {
        const { wrapper } = createWrapper({ [EXPERIMENT_NAME]: 'A' });

        const { result } = renderHook(() => useStaticExperiment(EXPERIMENT_NAME), { wrapper });

        expect(result.current).toBe('A');
    });

    it('returns disabled when the experiment was resolved as disabled', () => {
        const { wrapper } = createWrapper({ [EXPERIMENT_NAME]: 'disabled' });

        const { result } = renderHook(() => useStaticExperiment(EXPERIMENT_NAME), { wrapper });

        expect(result.current).toBe('disabled');
    });

    it('reflects updates dispatched after the initial render', () => {
        const { store, wrapper } = createWrapper({ [EXPERIMENT_NAME]: 'A' });

        const { result } = renderHook(() => useStaticExperiment(EXPERIMENT_NAME), { wrapper });
        expect(result.current).toBe('A');

        act(() => {
            store.dispatch(staticExperimentsActions.set({ [EXPERIMENT_NAME]: 'B' }));
        });

        expect(result.current).toBe('B');
    });
});
