import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-utilities/testing/getTestStore';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { KTUserContext } from '@proton/shared/lib/interfaces/KeyTransparency';
import type { MemberReadyForAutomaticUnprivatization } from '@proton/shared/lib/interfaces/Member';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import { entitlementCatalogReducer } from '../entitlementCatalog';
import { entitlementsReducer } from '../entitlements';
import { CATALOG_URL, ENTITLEMENTS_URL, asEntitlements } from '../entitlements/testing';
import { subscriptionReducer } from '../subscription';
import { getModelState } from '../testing/getModelState';
import { userReducer } from '../user';
import { getMemberRoles } from './index';
import { unprivatizeMember, unprivatizeSelfForMsp } from './unprivatizeActions';
import { updateOwnerRole } from './updateOwnerRole';

vi.mock('@proton/shared/lib/helpers/sentry', async () => ({
    ...(await vi.importActual('@proton/shared/lib/helpers/sentry')),
    captureMessage: vi.fn(),
}));

vi.mock('../userKeys', async () => ({
    ...(await vi.importActual('../userKeys')),
    userKeysThunk: vi.fn(() => 'userKeysThunk'),
}));

vi.mock('../organizationKey', async () => ({
    ...(await vi.importActual('../organizationKey')),
    organizationKeyThunk: vi.fn(() => 'organizationKeyThunk'),
}));

vi.mock('./index', async () => ({
    ...(await vi.importActual('./index')),
    getMemberAddresses: vi.fn(() => 'getMemberAddresses'),
    getMemberRoles: vi.fn(() => 'getMemberRoles'),
}));

vi.mock('./unprivatization', async () => ({
    ...(await vi.importActual('./unprivatization')),
    getUnprivatizeMemberPayload: vi.fn(() => Promise.resolve({})),
}));

vi.mock('./updateOwnerRole', () => ({
    updateOwnerRole: vi.fn(() => 'updateOwnerRole'),
}));

const captureMessageMock = vi.mocked(captureMessage);

const api = vi.fn();

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
        vi.clearAllMocks();
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

describe('unprivatizeMember', () => {
    const getMember = (Admin: boolean) =>
        ({
            ID: 'member-id',
            Unprivatization: {
                InvitationData: JSON.stringify({ Address: 'user@example.com', Revision: 1, Admin }),
            },
        }) as MemberReadyForAutomaticUnprivatization;

    const unprivatizeApi = vi.fn(() => Promise.resolve({}));

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each([
        { invitation: 'an admin invitation', Admin: true },
        { invitation: 'an invitation without admin access', Admin: false },
    ])('completes $invitation without reading or assigning roles', async ({ Admin }) => {
        await unprivatizeMember({
            member: getMember(Admin),
            ktUserContext: {} as KTUserContext,
            api: unprivatizeApi as unknown as Api,
        })(vi.fn() as any, vi.fn(), {} as ProtonThunkArguments);

        expect(getMemberRoles).not.toHaveBeenCalled();
        expect(updateOwnerRole).not.toHaveBeenCalled();
        expect(unprivatizeApi).toHaveBeenCalledTimes(1);
    });
});
