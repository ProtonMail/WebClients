import { renderHook } from '@testing-library/react-hooks';

import { CacheType } from '@proton/redux-utilities';
import { buildSubscription } from '@proton/testing/builders/subscription';
import { buildUser } from '@proton/testing/builders/user';

import { Renew } from '../../core/subscription/constants';
import { usePaymentPollers } from './usePaymentPollers';

const mockGetSubscription = jest.fn();
jest.mock('@proton/account/subscription/hooks', () => ({
    __esModule: true,
    useGetSubscription: () => mockGetSubscription,
}));

const mockGetPaymentMethods = jest.fn();
jest.mock('@proton/account/paymentMethods/hooks', () => ({
    __esModule: true,
    useGetPaymentMethods: () => mockGetPaymentMethods,
}));

const mockGetUser = jest.fn();
jest.mock('@proton/account/user/hooks', () => ({
    __esModule: true,
    useGetUser: () => mockGetUser,
}));

beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
});

it('should return all four polling factory methods', () => {
    const { result } = renderHook(() => usePaymentPollers());
    expect(result.current).toEqual({
        createSubscriptionPoller: expect.any(Function),
        createPaymentMethodsPoller: expect.any(Function),
        createCreditsPoller: expect.any(Function),
        createSubscriptionRenewEnabledPoller: expect.any(Function),
    });
});

describe('createSubscriptionPoller', () => {
    it('should resolve true when subscription changes', async () => {
        const initial = buildSubscription(undefined, { Amount: 100 });
        const updated = buildSubscription(undefined, { Amount: 200 });
        mockGetSubscription.mockResolvedValueOnce(initial).mockResolvedValue(updated);

        const { result } = renderHook(() => usePaymentPollers());
        const pollSubscription = result.current.createSubscriptionPoller();
        const promise = pollSubscription();
        await jest.runAllTimersAsync();

        await expect(promise).resolves.toBe(true);
    });

    it('should resolve false when subscription stays the same', async () => {
        const initial = buildSubscription(undefined, { Amount: 100 });
        mockGetSubscription.mockResolvedValue(initial);

        const { result } = renderHook(() => usePaymentPollers());
        const pollSubscription = result.current.createSubscriptionPoller();
        const promise = pollSubscription();
        await jest.runAllTimersAsync();

        await expect(promise).resolves.toBe(false);
    });

    it('should detect nested changes via deep equality', async () => {
        const initial = buildSubscription(undefined, { Plans: [] });
        const updated = buildSubscription(undefined, { Plans: [{ Name: 'mail2022' }] as any });
        mockGetSubscription.mockResolvedValueOnce(initial).mockResolvedValue(updated);

        const { result } = renderHook(() => usePaymentPollers());
        const pollSubscription = result.current.createSubscriptionPoller();
        const promise = pollSubscription();
        await jest.runAllTimersAsync();

        await expect(promise).resolves.toBe(true);
    });

    it('should pass CacheType.None to getSubscription for polling calls', async () => {
        const initial = buildSubscription();
        mockGetSubscription.mockResolvedValue(initial);

        const { result } = renderHook(() => usePaymentPollers());
        const pollSubscription = result.current.createSubscriptionPoller();
        void pollSubscription();
        await jest.runAllTimersAsync();

        expect(mockGetSubscription).toHaveBeenCalledWith({ cache: CacheType.None });
    });
});

describe('createPaymentMethodsPoller', () => {
    it('should resolve true when payment methods change', async () => {
        const initial = [{ ID: 'pm-1' }] as any;
        const updated = [{ ID: 'pm-1' }, { ID: 'pm-2' }] as any;
        mockGetPaymentMethods.mockResolvedValueOnce(initial).mockResolvedValue(updated);

        const { result } = renderHook(() => usePaymentPollers());
        const pollPaymentMethods = result.current.createPaymentMethodsPoller();
        const promise = pollPaymentMethods();
        await jest.runAllTimersAsync();

        await expect(promise).resolves.toBe(true);
    });

    it('should resolve false when payment methods stay the same', async () => {
        const initial = [{ ID: 'pm-1' }] as any;
        mockGetPaymentMethods.mockResolvedValue(initial);

        const { result } = renderHook(() => usePaymentPollers());
        const pollPaymentMethods = result.current.createPaymentMethodsPoller();
        const promise = pollPaymentMethods();
        await jest.runAllTimersAsync();

        await expect(promise).resolves.toBe(false);
    });

    it('should pass CacheType.None to getPaymentMethods for polling calls', async () => {
        const initial = [] as any;
        mockGetPaymentMethods.mockResolvedValue(initial);

        const { result } = renderHook(() => usePaymentPollers());
        const pollPaymentMethods = result.current.createPaymentMethodsPoller();
        void pollPaymentMethods();
        await jest.runAllTimersAsync();

        expect(mockGetPaymentMethods).toHaveBeenCalledWith({ cache: CacheType.None });
    });
});

describe('createCreditsPoller', () => {
    it('should resolve true when credits change', async () => {
        mockGetUser.mockResolvedValueOnce(buildUser({ Credit: 0 })).mockResolvedValue(buildUser({ Credit: 500 }));

        const { result } = renderHook(() => usePaymentPollers());
        const pollCredits = result.current.createCreditsPoller();
        const promise = pollCredits();
        await jest.runAllTimersAsync();

        await expect(promise).resolves.toBe(true);
    });

    it('should resolve false when credits stay the same', async () => {
        mockGetUser.mockResolvedValue(buildUser({ Credit: 0 }));

        const { result } = renderHook(() => usePaymentPollers());
        const pollCredits = result.current.createCreditsPoller();
        const promise = pollCredits();
        await jest.runAllTimersAsync();

        await expect(promise).resolves.toBe(false);
    });

    it('should pass CacheType.None to getUser for polling calls', async () => {
        mockGetUser.mockResolvedValue(buildUser());

        const { result } = renderHook(() => usePaymentPollers());
        const pollCredits = result.current.createCreditsPoller();
        void pollCredits();
        await jest.runAllTimersAsync();

        expect(mockGetUser).toHaveBeenCalledWith({ cache: CacheType.None });
    });
});

describe('createSubscriptionRenewEnabledPoller', () => {
    it('should resolve true when Renew becomes Enabled', async () => {
        mockGetSubscription.mockResolvedValue(buildSubscription(undefined, { Renew: Renew.Enabled }));

        const { result } = renderHook(() => usePaymentPollers());
        const pollSubscriptionRenewEnabled = result.current.createSubscriptionRenewEnabledPoller();
        const promise = pollSubscriptionRenewEnabled();
        await jest.runAllTimersAsync();

        await expect(promise).resolves.toBe(true);
    });

    it('should resolve false when Renew stays Disabled', async () => {
        mockGetSubscription.mockResolvedValue(buildSubscription(undefined, { Renew: Renew.Disabled }));

        const { result } = renderHook(() => usePaymentPollers());
        const pollSubscriptionRenewEnabled = result.current.createSubscriptionRenewEnabledPoller();
        const promise = pollSubscriptionRenewEnabled();
        await jest.runAllTimersAsync();

        await expect(promise).resolves.toBe(false);
    });
});
