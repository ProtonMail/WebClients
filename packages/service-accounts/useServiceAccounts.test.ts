// @vitest-environment happy-dom
import { type PropsWithChildren, createElement } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react';

import { domainsReducer } from '@proton/account/domains';
import { entitlementsReducer } from '@proton/account/entitlements';
import { membersReducer } from '@proton/account/members';
import { organizationReducer } from '@proton/account/organization';
import { organizationKeyReducer } from '@proton/account/organizationKey';
import { TestStoreProvider } from '@proton/account/testing/TestStoreProvider';
import { getModelState } from '@proton/account/testing/getModelState';
import { userPermissionsReducer } from '@proton/account/userPermissions';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import { getTestStore } from '@proton/redux-utilities/testing/getTestStore';
import type { ServiceAccount } from '@proton/shared/lib/interfaces/ServiceAccount';
import { ServiceAccountState } from '@proton/shared/lib/interfaces/ServiceAccount';

import { serviceAccountsReducer } from './slice';
import { useServiceAccounts } from './useServiceAccounts';

const mockApi = vi.fn();

const current = {
    MemberID: 'service-member',
    UserID: 'service-user',
    AddressID: 'service-address',
    Name: 'ci-bot',
    Email: 'ci-bot@example.test',
    State: ServiceAccountState.Active,
    CreateTime: 1,
    Managers: [{ MemberID: 'manager', DelegatedAccessID: 'access' }],
} satisfies ServiceAccount;

const renderServiceAccounts = () => {
    const { store } = getTestStore({
        reducer: {
            ...serviceAccountsReducer,
            ...membersReducer,
            ...userPermissionsReducer,
            ...organizationKeyReducer,
            ...organizationReducer,
            ...entitlementsReducer,
            ...domainsReducer,
        },
        preloadedState: {
            serviceAccounts: getInitialModelState<ServiceAccount[]>(),
            members: getModelState([
                { ID: 'manager', Name: 'Manager', Addresses: [{ Email: 'manager@example.test' }] },
            ]) as any,
            userPermissions: getModelState({ permissions: { 'account.user.update': true } }) as any,
            organizationKey: getModelState({ Key: {}, privateKey: {} }) as any,
            organization: getModelState({ Settings: {} }) as any,
            domains: getModelState([]) as any,
            entitlements: getModelState({
                UserEntitlements: [],
                MemberEntitlements: [],
                OrganizationEntitlements: [{ Name: EntitlementName.MaxServiceAccounts, Quantity: 5 }],
            }) as any,
        },
        extraThunkArguments: { api: mockApi } as unknown as ProtonThunkArguments,
    });
    const onError = vi.fn();
    const wrapper = ({ children }: PropsWithChildren) =>
        createElement(TestStoreProvider, {
            store,
            children: createElement(ErrorBoundary, { component: null, onError }, children),
        });
    return { ...renderHook(useServiceAccounts, { wrapper }), store, wrapper, onError };
};

beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockImplementation(async () => ({ ServiceAccounts: [current] }));
});

it('exposes the accounts with resolved manager names and permissions', async () => {
    const { result } = renderServiceAccounts();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.accounts).toEqual([current]);
    expect(result.current.managerNames).toEqual({ [current.MemberID]: ['Manager'] });
    expect(result.current.permissions).toMatchObject({
        canUpdate: true,
        canEdit: true,
        canCreate: false,
        maxServiceAccounts: 5,
        limitReached: false,
    });
});

it('reports initial fetch failures without crashing and recovers on retry', async () => {
    mockApi.mockRejectedValueOnce(new Error('offline'));
    const { result, onError } = renderServiceAccounts();
    await waitFor(() => expect(result.current.error).toEqual(expect.objectContaining({ message: 'offline' })));
    expect(result.current.loading).toBe(false);
    expect(result.current.accounts).toEqual([]);
    expect(onError).not.toHaveBeenCalled();
    await act(() => result.current.refresh());
    expect(result.current.error).toBeUndefined();
    expect(result.current.accounts).toEqual([current]);
});

it('shows the cached list on a revisit while refetching changes made elsewhere', async () => {
    const first = renderServiceAccounts();
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    first.unmount();

    const updated = { ...current, Managers: [], State: ServiceAccountState.NoManager };
    let resolve: (value: unknown) => void = () => {};
    mockApi.mockImplementation(() => new Promise((r) => (resolve = r)));
    const second = renderHook(useServiceAccounts, { wrapper: first.wrapper });
    expect(second.result.current).toMatchObject({ accounts: [current], loading: false });
    await act(async () => resolve({ ServiceAccounts: [updated] }));
    expect(second.result.current.accounts).toEqual([updated]);
    expect(mockApi).toHaveBeenCalledTimes(2);
});

it('keeps the cached list visible without a spinner when a background refresh fails', async () => {
    const { result, onError } = renderServiceAccounts();
    await waitFor(() => expect(result.current.accounts).toEqual([current]));
    mockApi.mockRejectedValueOnce(new Error('offline'));
    await act(() => result.current.refresh());
    expect(result.current.accounts).toEqual([current]);
    expect(result.current.loading).toBe(false);
    expect(onError).not.toHaveBeenCalled();
});

it('uses the normal missing-scope fallback without triggering the error boundary', async () => {
    mockApi.mockRejectedValueOnce({
        status: 403,
        data: { Code: 9100, Error: 'Access token does not have sufficient scope' },
    });
    const { result, onError } = renderServiceAccounts();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.accounts).toEqual([]);
    expect(onError).not.toHaveBeenCalled();
});

it('applies the refetched list to the store after a mutation', async () => {
    const { result } = renderServiceAccounts();
    await waitFor(() => expect(result.current.loading).toBe(false));
    const disabled = { ...current, State: ServiceAccountState.Disabled };
    mockApi.mockImplementation(async ({ method }) => (method === 'get' ? { ServiceAccounts: [disabled] } : {}));
    await act(() => result.current.setEnabled(current, false));
    expect(result.current.accounts).toEqual([disabled]);
});
