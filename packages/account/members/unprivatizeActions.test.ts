import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-shared-store/test';
import { CacheType } from '@proton/redux-utilities/interface';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { KTUserContext } from '@proton/shared/lib/interfaces/KeyTransparency';
import type { MemberReadyForAutomaticUnprivatization } from '@proton/shared/lib/interfaces/Member';
import type { OrganizationRole, RoleAssignment } from '@proton/shared/lib/interfaces/OrganizationRole';
import { PREDEFINED_ROLE_NAME } from '@proton/shared/lib/interfaces/OrganizationRole';
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

jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    ...jest.requireActual('@proton/shared/lib/helpers/sentry'),
    captureMessage: jest.fn(),
}));

jest.mock('../userKeys', () => ({
    ...jest.requireActual('../userKeys'),
    userKeysThunk: jest.fn(() => 'userKeysThunk'),
}));

jest.mock('../organizationKey', () => ({
    ...jest.requireActual('../organizationKey'),
    organizationKeyThunk: jest.fn(() => 'organizationKeyThunk'),
}));

jest.mock('./index', () => ({
    ...jest.requireActual('./index'),
    getMemberAddresses: jest.fn(() => 'getMemberAddresses'),
    getMemberRoles: jest.fn(() => 'getMemberRoles'),
}));

jest.mock('./unprivatization', () => ({
    ...jest.requireActual('./unprivatization'),
    getUnprivatizeMemberPayload: jest.fn(() => Promise.resolve({})),
}));

jest.mock('./updateOwnerRole', () => ({
    updateOwnerRole: jest.fn(() => 'updateOwnerRole'),
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

describe('unprivatizeMember', () => {
    const getRoleAssignment = (Name: PREDEFINED_ROLE_NAME) =>
        ({ Role: { OrganizationRoleID: `${Name}-id`, Name } as OrganizationRole }) as RoleAssignment;

    const getMember = (Admin: boolean) =>
        ({
            ID: 'member-id',
            Unprivatization: {
                InvitationData: JSON.stringify({ Address: 'user@example.com', Revision: 1, Admin }),
            },
        }) as MemberReadyForAutomaticUnprivatization;

    const unprivatizeApi = jest.fn(() => Promise.resolve({}));

    const run = async (member: MemberReadyForAutomaticUnprivatization, roles: RoleAssignment[]) => {
        const dispatch = jest.fn(async (action: unknown) => (action === 'getMemberRoles' ? roles : undefined));
        await unprivatizeMember({
            member,
            ktUserContext: {} as KTUserContext,
            api: unprivatizeApi as unknown as Api,
        })(dispatch as any, jest.fn(), {} as ProtonThunkArguments);
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('assigns the owner role when no role requiring the org key asked for the admin invitation', async () => {
        const member = getMember(true);
        await run(member, []);

        expect(getMemberRoles).toHaveBeenCalledWith({ member, cache: CacheType.None });
        expect(updateOwnerRole).toHaveBeenCalledWith({ member, makeAdmin: true, api: unprivatizeApi });
        expect(unprivatizeApi).toHaveBeenCalledTimes(1);
    });

    it('does not assign the owner role when the member holds a role requiring the org key', async () => {
        await run(getMember(true), [getRoleAssignment(PREDEFINED_ROLE_NAME.USER_ADMIN)]);

        expect(updateOwnerRole).not.toHaveBeenCalled();
        expect(unprivatizeApi).toHaveBeenCalledTimes(1);
    });

    it('does not assign any role to a member invited without admin access', async () => {
        await run(getMember(false), []);

        expect(getMemberRoles).not.toHaveBeenCalled();
        expect(updateOwnerRole).not.toHaveBeenCalled();
        expect(unprivatizeApi).toHaveBeenCalledTimes(1);
    });
});
