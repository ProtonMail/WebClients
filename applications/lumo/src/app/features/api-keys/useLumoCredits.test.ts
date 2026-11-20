import { renderHook, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { coreEventManagerV6 } from '@proton/account/bootstrap';
import { useApi } from '@proton/app-context/useApi';
import { MOCK_LUMO_CREDIT_RESPONSE } from '@proton/payments/testing/lumo-credit';

import { useLumoCredits } from './useLumoCredits';

vi.mock('@proton/app-context/useApi');
vi.mock('@proton/account/bootstrap', () => ({ coreEventManagerV6: vi.fn() }));

const coreEventManager = { subscribe: vi.fn(), start: vi.fn(), reset: vi.fn() };
const unsubscribe = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    coreEventManager.subscribe.mockReturnValue(unsubscribe);
    (coreEventManagerV6 as Mock).mockReturnValue(coreEventManager);
});

const setup = (api: Mock) => {
    (useApi as Mock).mockReturnValue(api);
    return renderHook(() => useLumoCredits()).result;
};

const emitCoreEvent = (event: object) => {
    const [listener] = coreEventManager.subscribe.mock.calls.at(-1)!;
    listener({ More: false, Refresh: false, EventID: 'event-id', ...event });
};

const isBalanceRequest = ([config]: any[]) => config.url === 'payments/v5/products/lumo-credit';

describe('useLumoCredits', () => {
    it('reads the balance in whole credits without notifying on failure', async () => {
        const api = vi.fn().mockResolvedValue({ ...MOCK_LUMO_CREDIT_RESPONSE, Balance: '5.5580000000' });

        const result = setup(api);

        expect(result.current).toMatchObject({ balance: undefined, loading: true });
        await waitFor(() => expect(result.current).toMatchObject({ balance: 5.558, loading: false }));
        expect(result.current.error).toBeUndefined();
        expect(api).toHaveBeenCalledWith({ url: 'payments/v5/products/lumo-credit', method: 'get', silence: true });
    });

    it('reports an error without a balance when the request fails', async () => {
        const error = new Error('You do not have an active subscription');
        const result = setup(vi.fn().mockRejectedValue(error));

        await waitFor(() => expect(result.current).toMatchObject({ balance: undefined, loading: false, error }));
    });

    it.each(['', 'not-a-number', null])('reports no balance when the balance is %p', async (Balance) => {
        const result = setup(vi.fn().mockResolvedValue({ ...MOCK_LUMO_CREDIT_RESPONSE, Balance }));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.balance).toBeUndefined();
    });

    describe('core events', () => {
        it('polls the core events while the balance is shown', () => {
            const { unmount } = renderHook(() => useLumoCredits());

            expect(coreEventManager.start).toHaveBeenCalledTimes(1);
            unmount();
            expect(unsubscribe).toHaveBeenCalledTimes(1);
            expect(coreEventManager.reset).toHaveBeenCalledTimes(1);
        });

        it.each([
            { name: 'a Lumo credits change', event: { LumoCredits: [{ ID: 'user-id', Action: 2 }] } },
            { name: 'a refresh', event: { Refresh: true } },
        ])('fetches the balance again on $name', async ({ event }) => {
            const api = vi.fn().mockResolvedValue(MOCK_LUMO_CREDIT_RESPONSE);
            setup(api);
            await waitFor(() => expect(api.mock.calls.filter(isBalanceRequest)).toHaveLength(1));

            emitCoreEvent(event);

            await waitFor(() => expect(api.mock.calls.filter(isBalanceRequest)).toHaveLength(2));
        });

        it('ignores core events about something else', async () => {
            const api = vi.fn().mockResolvedValue(MOCK_LUMO_CREDIT_RESPONSE);
            const result = setup(api);
            await waitFor(() => expect(result.current.loading).toBe(false));

            emitCoreEvent({ LumoCredits: null, Subscriptions: [{ ID: 'subscription-id', Action: 2 }] });

            expect(api.mock.calls.filter(isBalanceRequest)).toHaveLength(1);
        });
    });
});
