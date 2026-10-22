import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-shared-store/test';
import { scheduleOrgKeyDemotions } from '@proton/shared/lib/api/members';
import { getMembersOrganizationRoles } from '@proton/shared/lib/api/organizationRoles';
import type { EnhancedMember } from '@proton/shared/lib/interfaces/Member';

import { type MembersState, membersReducer, selectMembers } from '../members';
import { type ScimProgress, approveScimChanges } from './actions';
import { ItemStatus, OrgKeyDemotionApproval, Phase, getOrgKeyDemotionStatus } from './index';

const getMember = (ID: string): EnhancedMember =>
    ({
        ID,
        Name: `member-${ID}`,
        addressState: 'partial',
        roleState: 'full',
        UserOrganizationRoles: [],
        requiresOrgKeyPromotion: false,
        requiresOrgKeyDemotion: true,
        hasScheduledOrgKeyDemotion: false,
    }) as unknown as EnhancedMember;

// Mirrors the private ValueType enum in ../members (complete = fetched list).
const getMembersState = (value: EnhancedMember[]): MembersState['members'] => ({
    value,
    error: undefined,
    meta: { type: 1, fetchedAt: 1_700_000_000, fetchedEphemeral: true },
    unprivatization: { members: {}, loading: { approval: false, automatic: false } },
});

const setup = ({ members, api }: { members: EnhancedMember[]; api: jest.Mock }) => {
    const { store } = getTestStore({
        reducer: { ...membersReducer },
        preloadedState: { members: getMembersState(members) },
        extraThunkArguments: { api, unleashClient: { isEnabled: () => true } } as unknown as ProtonThunkArguments,
    });

    const approve = async (membersToDemote: EnhancedMember[]) => {
        const updates: ScimProgress[] = [];
        for await (const update of approveScimChanges({
            usersToApprove: [],
            groupsToApprove: [],
            pendingMembersByGroup: {},
            membersToDemote,
            api,
            getMemberPublicKeys: jest.fn(),
            dispatch: store.dispatch as unknown as Parameters<typeof approveScimChanges>[0]['dispatch'],
        })) {
            updates.push(update);
        }
        return updates;
    };

    const getMemberFromStore = (ID: string) =>
        selectMembers(store.getState() as MembersState).value?.find((member) => member.ID === ID);

    return { approve, getMemberFromStore };
};

// The roles endpoint, with every requested member's demotion task now scheduled
const getApi = ({ demotion = () => Promise.resolve({ Code: 1000 }) } = {}) =>
    jest.fn((config: { url: string; data?: { MemberIDs: string[] } }) => {
        if (config.url === scheduleOrgKeyDemotions([]).url) {
            return demotion();
        }
        return Promise.resolve({
            Members: (config.data?.MemberIDs ?? []).map((MemberID) => ({
                MemberID,
                RoleAssignments: [],
                RequiresOrgKeyPromotion: false,
                RequiresOrgKeyDemotion: true,
                HasScheduledOrgKeyDemotion: true,
            })),
        });
    });

describe('approveScimChanges with clean-up actions', () => {
    it('requests the demotions, then re-reads the flags of the members to demote', async () => {
        const members = [getMember('1'), getMember('2')];
        const api = getApi();
        const { approve, getMemberFromStore } = setup({ members, api });

        const updates = await approve(members);

        expect(api).toHaveBeenNthCalledWith(1, scheduleOrgKeyDemotions(['1', '2']));
        expect(api).toHaveBeenNthCalledWith(2, getMembersOrganizationRoles(['1', '2']));
        expect(updates.filter((update) => update.type === 'orgKeyDemotion' || update.type === 'phase')).toEqual([
            { type: 'phase', phase: Phase.Working },
            { type: 'orgKeyDemotion', approval: OrgKeyDemotionApproval.Requested },
            { type: 'orgKeyDemotion', approval: OrgKeyDemotionApproval.Enqueued },
            { type: 'phase', phase: Phase.Done },
        ]);
        expect(getOrgKeyDemotionStatus(getMemberFromStore('1'), OrgKeyDemotionApproval.Enqueued)).toBe(
            ItemStatus.Scheduled
        );
    });

    it('requests the demotions of at most 1,000 members at a time', async () => {
        const members = Array.from({ length: 1001 }, (_, index) => getMember(`${index}`));
        const api = getApi();
        const { approve } = setup({ members, api });

        await approve(members);

        const demotionCalls = api.mock.calls.filter(([config]) => config.url === scheduleOrgKeyDemotions([]).url);
        expect(demotionCalls.map(([config]) => config.data?.MemberIDs.length)).toEqual([1000, 1]);
    });

    it('does not request demotions without clean-up actions', async () => {
        const api = getApi();
        const { approve } = setup({ members: [getMember('1')], api });

        const updates = await approve([]);

        expect(api).not.toHaveBeenCalled();
        expect(updates.at(-1)).toEqual({ type: 'phase', phase: Phase.Done });
    });

    it('goes back to before approving when the request fails', async () => {
        const error = new Error('demotion failed');
        const api = getApi({ demotion: () => Promise.reject(error) });
        const { approve } = setup({ members: [getMember('1')], api });

        const updates = await approve([getMember('1')]);

        expect(updates.slice(-3)).toEqual([
            { type: 'orgKeyDemotion', approval: OrgKeyDemotionApproval.None },
            { type: 'error', error },
            { type: 'phase', phase: Phase.Idle },
        ]);
    });
});
