import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { EntitlementScope, EntitlementType, type Entitlements } from '@proton/payments/core/entitlements/interface';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import { CacheType } from '@proton/redux-utilities/interface';
import type { UserModel } from '@proton/shared/lib/interfaces';

import { getModelState } from '../tests';
import { userFulfilled, userReducer } from '../user';
import { entitlementsReducer, entitlementsThunk, selectEntitlements } from './index';

const user = { Subscribed: 1 } as UserModel;
const freeUser = { Subscribed: 0 } as UserModel;

describe('entitlements', () => {
    let mockEntitlements: Entitlements;

    const apiMock = jest.fn();

    beforeEach(() => {
        mockEntitlements = {
            UserEntitlements: [],
            OrganizationEntitlements: [],
            MemberEntitlements: [],
        };
        apiMock.mockReset().mockImplementation(() => {
            return Promise.resolve(mockEntitlements);
        });
    });

    const setup = (currentUser: UserModel | null = user) => {
        const extraThunkArguments = {
            api: apiMock,
        } as unknown as ProtonThunkArguments;

        return getTestStore({
            reducer: { ...userReducer, ...entitlementsReducer },
            preloadedState: { user: getModelState(currentUser ?? undefined) },
            extraThunkArguments,
        });
    };

    it('should have no value before the first fetch', () => {
        const { store } = setup();
        const state = selectEntitlements(store.getState());
        expect(state.value).toBeUndefined();
        expect(state.error).toBeUndefined();
        expect(state.meta.fetchedAt).toBe(0);
    });

    it('should fetch entitlements from API', async () => {
        mockEntitlements = {
            UserEntitlements: [
                {
                    Name: EntitlementName.FlagsPass,
                    Quantity: 1,
                    Type: EntitlementType.Switch,
                    Scope: EntitlementScope.Organization,
                },
            ],
            OrganizationEntitlements: [],
            MemberEntitlements: [],
        };

        const { store } = setup();
        await store.dispatch(entitlementsThunk());

        expect(apiMock).toHaveBeenCalled();
        expect(selectEntitlements(store.getState()).value).toEqual(mockEntitlements);
    });

    it('should store entitlements with multiple items across categories', async () => {
        mockEntitlements = {
            UserEntitlements: [
                {
                    Name: EntitlementName.FlagsPass,
                    Quantity: 1,
                    Type: EntitlementType.Switch,
                    Scope: EntitlementScope.Organization,
                },
                {
                    Name: EntitlementName.MaxSpace,
                    Quantity: 500,
                    Type: EntitlementType.Value,
                    Scope: EntitlementScope.MemberAssignable,
                },
            ],
            OrganizationEntitlements: [
                {
                    Name: EntitlementName.MaxSpace,
                    Quantity: 1000,
                    Type: EntitlementType.Value,
                    Scope: EntitlementScope.MemberAssignable,
                },
            ],
            MemberEntitlements: [],
        };

        const { store } = setup();
        await store.dispatch(entitlementsThunk());

        expect(selectEntitlements(store.getState()).value).toEqual(mockEntitlements);
    });

    it('should fetch entitlements for free users too', async () => {
        const { store } = setup(freeUser);
        await store.dispatch(entitlementsThunk());

        expect(apiMock).toHaveBeenCalled();
    });

    it('should fetch entitlements even without a user', async () => {
        const { store } = setup(null);
        const result = await store.dispatch(entitlementsThunk());

        expect(apiMock).toHaveBeenCalled();
        expect(result).toEqual(mockEntitlements);
        expect(selectEntitlements(store.getState()).value).toEqual(mockEntitlements);
    });

    it('should not re-fetch once a user shows up if already fetched', async () => {
        mockEntitlements = {
            UserEntitlements: [
                {
                    Name: EntitlementName.FlagsPass,
                    Quantity: 1,
                    Type: EntitlementType.Switch,
                    Scope: EntitlementScope.Organization,
                },
            ],
            OrganizationEntitlements: [],
            MemberEntitlements: [],
        };

        const { store } = setup(null);
        await store.dispatch(entitlementsThunk());
        expect(apiMock).toHaveBeenCalledTimes(1);

        store.dispatch(userFulfilled(user));
        await store.dispatch(entitlementsThunk());

        expect(apiMock).toHaveBeenCalledTimes(1);
        expect(selectEntitlements(store.getState()).value).toEqual(mockEntitlements);
    });

    it('should not re-fetch if already cached', async () => {
        const { store } = setup();
        await store.dispatch(entitlementsThunk());
        await store.dispatch(entitlementsThunk());

        expect(apiMock).toHaveBeenCalledTimes(1);
    });

    it('should re-fetch when the cache is explicitly bypassed', async () => {
        const { store } = setup();
        await store.dispatch(entitlementsThunk());
        await store.dispatch(entitlementsThunk({ cache: CacheType.None }));

        expect(apiMock).toHaveBeenCalledTimes(2);
        expect(selectEntitlements(store.getState()).value).toEqual(mockEntitlements);
    });

    it('should reject and leave the entitlements unset on API error', async () => {
        apiMock.mockImplementation(() => {
            const error = new Error('API error');
            error.name = 'ApiError';
            return Promise.reject(error);
        });

        const { store } = setup();
        await expect(store.dispatch(entitlementsThunk())).rejects.toMatchObject({
            name: 'ApiError',
            message: 'API error',
        });

        const state = selectEntitlements(store.getState());
        expect(state.value).toBeUndefined();
        expect(state.error).toEqual(expect.objectContaining({ message: 'API error' }));
    });

    it('should keep the last successful entitlements when a refetch fails', async () => {
        mockEntitlements = {
            UserEntitlements: [],
            OrganizationEntitlements: [
                {
                    Name: EntitlementName.Business,
                    Quantity: 1,
                    Type: EntitlementType.Switch,
                    Scope: EntitlementScope.Organization,
                },
            ],
            MemberEntitlements: [],
        };

        const { store } = setup();
        await store.dispatch(entitlementsThunk());

        apiMock.mockImplementationOnce(() => {
            return Promise.reject(new Error('API error'));
        });
        await expect(store.dispatch(entitlementsThunk({ cache: CacheType.None }))).rejects.toThrow('API error');

        const state = selectEntitlements(store.getState());
        expect(state.value).toEqual(mockEntitlements);
        expect(state.error).toEqual(expect.objectContaining({ message: 'API error' }));
    });

    it('should retry on the next read after a failure', async () => {
        apiMock.mockImplementationOnce(() => {
            return Promise.reject(new Error('API error'));
        });
        mockEntitlements = {
            UserEntitlements: [
                {
                    Name: EntitlementName.FlagsPass,
                    Quantity: 1,
                    Type: EntitlementType.Switch,
                    Scope: EntitlementScope.Organization,
                },
            ],
            OrganizationEntitlements: [],
            MemberEntitlements: [],
        };

        const { store } = setup();
        await expect(store.dispatch(entitlementsThunk())).rejects.toThrow('API error');

        const entitlements = await store.dispatch(entitlementsThunk());

        expect(apiMock).toHaveBeenCalledTimes(2);
        expect(entitlements).toEqual(mockEntitlements);
        const state = selectEntitlements(store.getState());
        expect(state.value).toEqual(mockEntitlements);
        expect(state.error).toBeUndefined();
    });
});
