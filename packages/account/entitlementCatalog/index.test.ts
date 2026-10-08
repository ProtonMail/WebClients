import { ADDON_NAMES, PLANS } from '@proton/payments/core/constants';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import {
    type EntitlementCatalog,
    EntitlementMergeStrategy,
    EntitlementScope,
    EntitlementType,
} from '@proton/payments/core/entitlements/interface';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import { CacheType } from '@proton/redux-utilities/interface';
import { DAY, HOUR } from '@proton/shared/lib/constants';

import { entitlementCatalogReducer, entitlementCatalogThunk, selectEntitlementCatalog } from './index';

describe('entitlementCatalog', () => {
    let mockCatalog: EntitlementCatalog;

    const savedCatalog: EntitlementCatalog = {
        Plans: [
            {
                Name: PLANS.BUNDLE_PRO_2024,
                Entitlements: [
                    {
                        Name: EntitlementName.Sentinel,
                        Quantity: 1,
                        Type: EntitlementType.Switch,
                        Scope: EntitlementScope.Organization,
                        MergeStrategy: EntitlementMergeStrategy.Max,
                    },
                ],
            },
        ],
        Addons: [],
    };

    const apiMock = jest.fn();

    beforeEach(() => {
        mockCatalog = {
            Plans: [],
            Addons: [],
        };
        apiMock.mockReset().mockImplementation(() => {
            return Promise.resolve(mockCatalog);
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const setup = (preloadedState: object = {}) => {
        const extraThunkArguments = {
            api: apiMock,
        } as unknown as ProtonThunkArguments;

        return getTestStore({
            reducer: { ...entitlementCatalogReducer },
            preloadedState,
            extraThunkArguments,
        });
    };

    it('should start without a catalog', () => {
        const { store } = setup();
        const state = selectEntitlementCatalog(store.getState());
        expect(state.value).toBeUndefined();
        expect(state.error).toBeUndefined();
        expect(state.meta.fetchedAt).toBe(0);
    });

    it('should fetch the entitlement catalog from the API', async () => {
        mockCatalog = {
            Plans: [
                {
                    Name: PLANS.BUNDLE,
                    Entitlements: [
                        {
                            Name: EntitlementName.FlagsPass,
                            Quantity: 1,
                            Type: EntitlementType.Switch,
                            Scope: EntitlementScope.Organization,
                            MergeStrategy: EntitlementMergeStrategy.Max,
                        },
                    ],
                },
            ],
            Addons: [
                {
                    Name: ADDON_NAMES.LUMO_DRIVE,
                    Entitlements: [
                        {
                            Name: EntitlementName.MaxSpace,
                            Quantity: 100,
                            Type: EntitlementType.Value,
                            Scope: EntitlementScope.MemberAssignable,
                            MergeStrategy: EntitlementMergeStrategy.Max,
                        },
                    ],
                },
            ],
        };

        const { store } = setup();
        await store.dispatch(entitlementCatalogThunk());

        expect(apiMock).toHaveBeenCalled();
        expect(selectEntitlementCatalog(store.getState()).value).toEqual(mockCatalog);
    });

    it('should not re-fetch if already cached', async () => {
        const { store } = setup();
        await store.dispatch(entitlementCatalogThunk());
        await store.dispatch(entitlementCatalogThunk());

        expect(apiMock).toHaveBeenCalledTimes(1);
    });

    it('should re-fetch when the cache is explicitly bypassed', async () => {
        const { store } = setup();
        await store.dispatch(entitlementCatalogThunk());
        await store.dispatch(entitlementCatalogThunk({ cache: CacheType.None }));

        expect(apiMock).toHaveBeenCalledTimes(2);
        expect(selectEntitlementCatalog(store.getState()).value).toEqual(mockCatalog);
    });

    it('should reject and leave the catalog unset on API error', async () => {
        apiMock.mockImplementation(() => {
            return Promise.reject(new Error('API error'));
        });

        const { store } = setup();
        await expect(store.dispatch(entitlementCatalogThunk())).rejects.toThrow('API error');

        const state = selectEntitlementCatalog(store.getState());
        expect(state.error).toEqual(expect.objectContaining({ message: 'API error' }));
        expect(state.value).toBeUndefined();
    });

    it('should keep the last successful catalog when a later fetch fails', async () => {
        const { store } = setup();
        await store.dispatch(entitlementCatalogThunk());

        apiMock.mockImplementationOnce(() => {
            return Promise.reject(new Error('API error'));
        });
        await expect(store.dispatch(entitlementCatalogThunk({ cache: CacheType.None }))).rejects.toThrow('API error');

        const state = selectEntitlementCatalog(store.getState());
        expect(state.value).toEqual(mockCatalog);
        expect(state.error).toEqual(expect.objectContaining({ message: 'API error' }));
    });

    it('should retry on the next read after a failure', async () => {
        apiMock.mockImplementationOnce(() => {
            return Promise.reject(new Error('API error'));
        });

        const { store } = setup();
        await expect(store.dispatch(entitlementCatalogThunk())).rejects.toThrow('API error');

        mockCatalog = {
            Plans: [{ Name: PLANS.BUNDLE, Entitlements: [] }],
            Addons: [],
        };
        const catalog = await store.dispatch(entitlementCatalogThunk());

        expect(apiMock).toHaveBeenCalledTimes(2);
        expect(catalog).toEqual(mockCatalog);
        const state = selectEntitlementCatalog(store.getState());
        expect(state.value).toEqual(mockCatalog);
        expect(state.error).toBeUndefined();
    });

    it('should serve a successful catalog from the cache for the whole day', async () => {
        jest.useFakeTimers();

        const { store } = setup();
        await store.dispatch(entitlementCatalogThunk());

        jest.advanceTimersByTime(12 * HOUR);
        const catalog = await store.dispatch(entitlementCatalogThunk());

        expect(apiMock).toHaveBeenCalledTimes(1);
        expect(catalog).toEqual(mockCatalog);
    });

    /**
     * What a catalog loaded back from disk looks like: `fetchedEphemeral` is stripped when the state is saved, and
     * that missing field is how the store recognises a value it did not fetch in this session.
     */
    const restoredFromDisk = (fetchedAt: number) => ({
        entitlementCatalog: {
            value: savedCatalog,
            error: undefined,
            meta: { fetchedAt, fetchedEphemeral: undefined },
        },
    });

    it('should serve a catalog restored from disk without waiting, and refresh it', async () => {
        mockCatalog = {
            Plans: [{ Name: PLANS.MAIL, Entitlements: [] }],
            Addons: [],
        };

        const { store } = setup(restoredFromDisk(Date.now() - HOUR));

        const catalog = await store.dispatch(entitlementCatalogThunk());
        expect(catalog).toEqual(savedCatalog);
        expect(apiMock).toHaveBeenCalledTimes(1);

        const refreshed = await store.dispatch(entitlementCatalogThunk());
        expect(refreshed).toEqual(mockCatalog);
        expect(apiMock).toHaveBeenCalledTimes(1);
        expect(selectEntitlementCatalog(store.getState()).value).toEqual(mockCatalog);
    });

    it('should refetch a catalog restored from disk that is older than a day', async () => {
        mockCatalog = {
            Plans: [{ Name: PLANS.MAIL, Entitlements: [] }],
            Addons: [],
        };

        const { store } = setup(restoredFromDisk(Date.now() - 2 * DAY));

        const catalog = await store.dispatch(entitlementCatalogThunk());

        expect(apiMock).toHaveBeenCalledTimes(1);
        expect(catalog).toEqual(mockCatalog);
        expect(selectEntitlementCatalog(store.getState()).value).toEqual(mockCatalog);
    });
});
