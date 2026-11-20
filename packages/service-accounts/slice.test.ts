import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-utilities/testing/getTestStore';
import { type ServiceAccount, ServiceAccountState } from '@proton/shared/lib/interfaces/ServiceAccount';

import { refetchServiceAccounts, selectServiceAccounts, serviceAccountsReducer, serviceAccountsThunk } from './slice';

const account: ServiceAccount = {
    MemberID: 'service-member',
    UserID: 'service-user',
    AddressID: 'service-address',
    Name: 'ci-bot',
    Email: 'ci-bot@example.test',
    Managers: [{ MemberID: 'manager', DelegatedAccessID: 'manager-access' }],
    State: ServiceAccountState.Active,
    CreateTime: 1,
};

const setup = () => {
    const api = vi.fn().mockResolvedValue({ ServiceAccounts: [account] });
    const { store } = getTestStore({
        reducer: serviceAccountsReducer,
        extraThunkArguments: { api } as unknown as ProtonThunkArguments,
    });
    return { api, store, getModel: () => selectServiceAccounts(store.getState()) };
};

it('deduplicates concurrent fetches and serves the shared cache', async () => {
    const { api, store, getModel } = setup();
    const first = store.dispatch(serviceAccountsThunk());
    const second = store.dispatch(serviceAccountsThunk());
    expect(api).toHaveBeenCalledTimes(1);
    await Promise.all([first, second]);
    await store.dispatch(serviceAccountsThunk());
    expect(api).toHaveBeenCalledTimes(1);
    expect(getModel().value).toEqual([account]);
});

it('preserves API failures for the shared error handling and supports refetching', async () => {
    const { api, store, getModel } = setup();
    const error = { status: 503, data: { Error: 'Service unavailable' } };
    api.mockRejectedValueOnce(error);
    await expect(store.dispatch(serviceAccountsThunk())).rejects.toBe(error);
    expect(getModel().value).toBeUndefined();
    expect(getModel().error).toBeDefined();
    await store.dispatch(refetchServiceAccounts());
    expect(getModel().error).toBeUndefined();
    expect(getModel().value).toEqual([account]);
});

it('uses the same missing-scope fallback as the members model', async () => {
    const { api, store, getModel } = setup();
    api.mockRejectedValueOnce({
        status: 403,
        data: { Code: 9100, Error: 'Access token does not have sufficient scope' },
    });
    await expect(store.dispatch(serviceAccountsThunk())).resolves.toEqual([]);
    expect(getModel().error).toBeUndefined();
    expect(api).toHaveBeenCalledWith({ method: 'get', url: 'account/v1/service-accounts' });
});

it('does not swallow other permission errors as an empty list', async () => {
    const { api, store, getModel } = setup();
    const error = { status: 403, data: { Code: 2011, Error: 'Not allowed' } };
    api.mockRejectedValueOnce(error);
    await expect(store.dispatch(serviceAccountsThunk())).rejects.toBe(error);
    expect(getModel().value).toBeUndefined();
    expect(getModel().error).toBeDefined();
});

it('keeps the cached list when a refetch fails', async () => {
    const { api, store, getModel } = setup();
    await store.dispatch(serviceAccountsThunk());
    api.mockRejectedValueOnce(new Error('offline'));
    await expect(store.dispatch(refetchServiceAccounts())).rejects.toThrow('offline');
    expect(getModel().value).toEqual([account]);
});
