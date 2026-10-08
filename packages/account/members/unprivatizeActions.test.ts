import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { Api, UserModel } from '@proton/shared/lib/interfaces';

import { entitlementCatalogReducer } from '../entitlementCatalog';
import { entitlementsReducer } from '../entitlements';
import { CATALOG_URL, ENTITLEMENTS_URL, asEntitlements } from '../entitlements/testing';
import { subscriptionReducer } from '../subscription';
import { getModelState } from '../tests';
import { userReducer } from '../user';
import { unprivatizeSelfForMsp } from './unprivatizeActions';

jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    ...jest.requireActual('@proton/shared/lib/helpers/sentry'),
    captureMessage: jest.fn(),
}));

const captureMessageMock = jest.mocked(captureMessage);

const api = jest.fn();

const setup = () => {
    const { store } = getTestStore({
        reducer: {
            ...userReducer,
            ...entitlementsReducer,
            ...entitlementCatalogReducer,
            ...subscriptionReducer,
        },
        // Free user: the subscription thunk serves its own fallback without touching the api.
        preloadedState: { user: getModelState({ Subscribed: 0, isAdmin: false, isPaid: false } as UserModel) },
        extraThunkArguments: { api } as unknown as ProtonThunkArguments,
    });

    return store as any;
};

describe('unprivatizeSelfForMsp', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        api.mockImplementation(({ url }: { url: string }) => {
            if (url === ENTITLEMENTS_URL) {
                return Promise.resolve(asEntitlements([]));
            }
            if (url === CATALOG_URL) {
                return Promise.resolve(buildEntitlementCatalog());
            }
            return Promise.reject(new Error(`unexpected url ${url}`));
        });
    });

    it('reports to sentry when the entitlements could not be fetched', async () => {
        api.mockImplementation(({ url }: { url: string }) => {
            if (url === ENTITLEMENTS_URL) {
                return Promise.reject(new Error('API error'));
            }
            return Promise.resolve(buildEntitlementCatalog());
        });

        const store = setup();
        await store.dispatch(unprivatizeSelfForMsp({ api: api as unknown as Api }));

        expect(captureMessageMock).toHaveBeenCalledTimes(1);
        const [message, options] = captureMessageMock.mock.calls[0];
        expect(message).toBe('MSP: Error unprivatizing self on organization key creation');
        expect((options as any).extra.error).toMatchObject({ message: 'API error' });
    });

    it('stays silent when the entitlements were fetched and the org is not msp eligible', async () => {
        const store = setup();
        await store.dispatch(unprivatizeSelfForMsp({ api: api as unknown as Api }));

        expect(captureMessageMock).not.toHaveBeenCalled();
    });

    it('does not report a connection issue', async () => {
        api.mockImplementation(({ url }: { url: string }) => {
            if (url === ENTITLEMENTS_URL) {
                const error = new Error('Internet connection lost');
                error.name = 'OfflineError';
                return Promise.reject(error);
            }
            return Promise.resolve(buildEntitlementCatalog());
        });

        const store = setup();
        await store.dispatch(unprivatizeSelfForMsp({ api: api as unknown as Api }));

        expect(captureMessageMock).not.toHaveBeenCalled();
    });
});
