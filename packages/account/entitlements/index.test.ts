import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { EntitlementScope, EntitlementType, type Entitlements } from '@proton/payments/core/entitlements/interface';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';

import { entitlementsReducer, entitlementsThunk, selectEntitlements } from './index';

describe('entitlements', () => {
    let mockEntitlements: Entitlements;

    beforeEach(() => {
        jest.clearAllMocks();
        mockEntitlements = {
            UserEntitlements: [],
            OrganizationEntitlements: [],
            MemberEntitlements: [],
        };
    });

    const apiMock = jest.fn().mockImplementation(() => {
        return Promise.resolve(mockEntitlements);
    });

    const setup = () => {
        const extraThunkArguments = {
            api: apiMock,
        } as unknown as ProtonThunkArguments;

        return getTestStore({
            reducer: { ...entitlementsReducer },
            preloadedState: {},
            extraThunkArguments,
        });
    };

    it('should have correct initial state', () => {
        const { store } = setup();
        const state = selectEntitlements(store.getState());
        expect(state.value).toEqual({
            UserEntitlements: [],
            OrganizationEntitlements: [],
            MemberEntitlements: [],
        });
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
                    Scope: EntitlementScope.Global,
                },
            ],
            OrganizationEntitlements: [],
            MemberEntitlements: [],
        };

        const { store } = setup();
        await store.dispatch(entitlementsThunk());

        expect(apiMock).toHaveBeenCalled();
        expect(selectEntitlements(store.getState())).toMatchObject({
            value: {
                UserEntitlements: [
                    {
                        Name: EntitlementName.FlagsPass,
                        Quantity: 1,
                        Type: EntitlementType.Switch,
                    },
                ],
                OrganizationEntitlements: [],
                MemberEntitlements: [],
            },
        });
    });

    it('should store entitlements with multiple items across categories', async () => {
        mockEntitlements = {
            UserEntitlements: [
                {
                    Name: EntitlementName.FlagsPass,
                    Quantity: 1,
                    Type: EntitlementType.Switch,
                    Scope: EntitlementScope.Global,
                },
                {
                    Name: EntitlementName.MaxSpace,
                    Quantity: 500,
                    Type: EntitlementType.Value,
                    Scope: EntitlementScope.Distributed,
                },
            ],
            OrganizationEntitlements: [
                {
                    Name: EntitlementName.MaxSpace,
                    Quantity: 1000,
                    Type: EntitlementType.Value,
                    Scope: EntitlementScope.Distributed,
                },
            ],
            MemberEntitlements: [],
        };

        const { store } = setup();
        await store.dispatch(entitlementsThunk());

        expect(selectEntitlements(store.getState())).toMatchObject({
            value: mockEntitlements,
        });
    });

    it('should not re-fetch if already cached', async () => {
        const { store } = setup();
        await store.dispatch(entitlementsThunk());
        await store.dispatch(entitlementsThunk());

        expect(apiMock).toHaveBeenCalledTimes(1);
    });

    it('should handle API error', async () => {
        apiMock.mockImplementationOnce(() => {
            return Promise.reject(new Error('API error'));
        });

        const { store } = setup();
        await expect(store.dispatch(entitlementsThunk())).rejects.toThrow('API error');

        const state = selectEntitlements(store.getState());
        expect(state.error).toBeDefined();
        expect(state.value).toEqual({
            UserEntitlements: [],
            OrganizationEntitlements: [],
            MemberEntitlements: [],
        });
    });
});
