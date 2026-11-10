import type { FC, PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { act, renderHook, waitFor } from '@testing-library/react';

import { AppStateContext } from '../../components/Core/AppStateProvider';
import { AppStatus } from '../../types/worker/state';
import { useAutoUnlock } from './useAutoUnlock';

const SETTLE_DELAY = 60;
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, SETTLE_DELAY)));

const Wrapper: FC<PropsWithChildren> = ({ children }) => (
    <MemoryRouter>
        <AppStateContext.Provider value={{ status: AppStatus.IDLE, authorized: false, booted: false } as any}>
            {children}
        </AppStateContext.Provider>
    </MemoryRouter>
);

describe('useAutoUnlock', () => {
    beforeEach(() => {
        jest.spyOn(document, 'hasFocus').mockReturnValue(true);
    });

    afterEach(() => jest.restoreAllMocks());

    test('prompts once when the window is visible', async () => {
        const onUnlock = jest.fn().mockResolvedValue(undefined);
        renderHook(() => useAutoUnlock({ loading: false, onUnlock }), { wrapper: Wrapper });

        await waitFor(() => expect(onUnlock).toHaveBeenCalledTimes(1));
    });

    test('does not prompt while the last attempt is flagged as failed or declined', async () => {
        const onUnlock = jest.fn().mockResolvedValue(undefined);
        renderHook(() => useAutoUnlock({ loading: false, onUnlock, error: true }), { wrapper: Wrapper });

        await settle();
        expect(onUnlock).not.toHaveBeenCalled();
    });

    test('does not prompt again when the attempt settles as declined', async () => {
        const onUnlock = jest.fn().mockResolvedValue(undefined);
        const { rerender } = renderHook(
            (props: { loading: boolean; error: boolean }) => useAutoUnlock({ ...props, onUnlock }),
            { wrapper: Wrapper, initialProps: { loading: false, error: false } }
        );

        await waitFor(() => expect(onUnlock).toHaveBeenCalledTimes(1));

        rerender({ loading: true, error: false });
        rerender({ loading: false, error: true });
        await settle();

        expect(onUnlock).toHaveBeenCalledTimes(1);
    });

    test('prompts again after the attempt settles without an error', async () => {
        const onUnlock = jest.fn().mockResolvedValue(undefined);
        const { rerender } = renderHook(
            (props: { loading: boolean; error: boolean }) => useAutoUnlock({ ...props, onUnlock }),
            { wrapper: Wrapper, initialProps: { loading: false, error: false } }
        );

        await waitFor(() => expect(onUnlock).toHaveBeenCalledTimes(1));

        rerender({ loading: true, error: false });
        rerender({ loading: false, error: false });

        await waitFor(() => expect(onUnlock).toHaveBeenCalledTimes(2));
    });
});
