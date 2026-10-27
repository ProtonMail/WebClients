import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { EntitlementScope, EntitlementType, type Entitlements } from '@proton/payments/core/entitlements/interface';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-shared-store/test';
import { getGroupOwnerInvites } from '@proton/shared/lib/api/groups';
import type { GroupOwnerInvite } from '@proton/shared/lib/interfaces/GroupMember';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import { entitlementsReducer } from '../entitlements';
import { getModelState } from '../testing/getModelState';
import { userReducer } from '../user';
import { groupOwnerInvitesReducer, groupOwnerInvitesThunk } from './index';

const invitesUrl = getGroupOwnerInvites().url;

const groupsEntitlements: Entitlements = {
    UserEntitlements: [],
    OrganizationEntitlements: [
        {
            Name: EntitlementName.Groups,
            Quantity: 1,
            Type: EntitlementType.Switch,
            Scope: EntitlementScope.Organization,
        },
    ],
    MemberEntitlements: [],
};

const noGroupsEntitlements: Entitlements = {
    UserEntitlements: [],
    OrganizationEntitlements: [],
    MemberEntitlements: [],
};

const invite = { GroupOwnerInviteID: 'invite-1' } as GroupOwnerInvite;

describe('groupOwnerInvitesThunk', () => {
    const apiMock = jest.fn();
    const isEnabled = jest.fn();

    const setup = ({ flag, entitlements }: { flag: boolean; entitlements: Entitlements }) => {
        isEnabled.mockReset().mockImplementation((name: string) => name === 'UserGroupsGroupOwner' && flag);
        apiMock.mockReset().mockImplementation((config: { url?: string }) => {
            if (config?.url === invitesUrl) {
                return Promise.resolve({ Invites: [invite] });
            }
            return Promise.resolve(entitlements);
        });

        const extraThunkArguments = {
            api: apiMock,
            unleashClient: { isEnabled },
        } as unknown as ProtonThunkArguments;

        return getTestStore({
            reducer: { ...userReducer, ...entitlementsReducer, ...groupOwnerInvitesReducer },
            preloadedState: { user: getModelState({ Subscribed: 1 } as UserModel) },
            extraThunkArguments,
        });
    };

    const invitesRequests = () =>
        apiMock.mock.calls.filter(([config]: [{ url?: string }]) => config?.url === invitesUrl);

    it('fetches invites when the flag is on and the organization has the groups entitlement', async () => {
        const { store } = setup({ flag: true, entitlements: groupsEntitlements });

        const result = await store.dispatch(groupOwnerInvitesThunk());

        expect(invitesRequests()).toHaveLength(1);
        expect(result).toEqual({ 'invite-1': invite });
    });

    it('does not fetch invites without the groups entitlement (upsell or groups frozen after a downgrade)', async () => {
        const { store } = setup({ flag: true, entitlements: noGroupsEntitlements });

        const result = await store.dispatch(groupOwnerInvitesThunk());

        expect(invitesRequests()).toHaveLength(0);
        expect(result).toEqual({});
    });

    it('does not fetch anything when the UserGroupsGroupOwner flag is off', async () => {
        const { store } = setup({ flag: false, entitlements: groupsEntitlements });

        const result = await store.dispatch(groupOwnerInvitesThunk());

        expect(apiMock).not.toHaveBeenCalled();
        expect(result).toEqual({});
    });

    it('does not fetch invites when entitlements cannot be loaded', async () => {
        const { store } = setup({ flag: true, entitlements: groupsEntitlements });
        apiMock.mockImplementation((config: { url?: string }) => {
            if (config?.url === invitesUrl) {
                return Promise.resolve({ Invites: [invite] });
            }
            return Promise.reject(new Error('API error'));
        });

        const result = await store.dispatch(groupOwnerInvitesThunk());

        expect(invitesRequests()).toHaveLength(0);
        expect(result).toEqual({});
    });
});
