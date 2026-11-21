import type { EnhancedMember, Member } from '@proton/shared/lib/interfaces/Member';

import { type MembersState, membersReducer, upsertMember, upsertMembers } from './index';

const reducer = membersReducer.members;

const getMember = (ID: string, overrides: Partial<EnhancedMember> = {}): EnhancedMember =>
    ({
        ID,
        Name: `member-${ID}`,
        addressState: 'full',
        Addresses: [{ ID: `address-${ID}` }],
        roleState: 'full',
        UserOrganizationRoles: [],
        requiresOrgKeyPromotion: false,
        requiresOrgKeyDemotion: false,
        hasScheduledOrgKeyDemotion: false,
        ...overrides,
    }) as unknown as EnhancedMember;

// Mirrors the private ValueType enum in ./index (complete = fetched list).
const getMembersState = (value: EnhancedMember[]): MembersState['members'] => ({
    value,
    error: undefined,
    meta: { type: 1, fetchedAt: 1_700_000_000, fetchedEphemeral: true },
    unprivatization: { members: {}, loading: { approval: false, automatic: false } },
});

const fromApi = (ID: string, Name: string) => ({ ID, Name }) as unknown as Member;

describe('upsertMembers', () => {
    it('applies every payload like upsertMember would, in a single action', () => {
        const initial = getMembersState([getMember('1'), getMember('2'), getMember('3')]);
        const payloads = [
            { member: fromApi('1', 'renamed'), invalidateAddresses: true },
            { member: fromApi('2', 'renamed') },
            { member: fromApi('3', 'gone'), type: 'delete' as const },
            { member: fromApi('4', 'new') },
        ];

        const batched = reducer(initial, upsertMembers(payloads));
        const sequential = payloads.reduce((state, payload) => reducer(state, upsertMember(payload)), initial);

        expect(batched).toEqual(sequential);
        expect(batched.value?.map(({ ID, Name, addressState }) => ({ ID, Name, addressState }))).toEqual([
            { ID: '1', Name: 'renamed', addressState: 'stale' },
            { ID: '2', Name: 'renamed', addressState: 'full' },
            { ID: '4', Name: 'new', addressState: 'partial' },
        ]);
    });

    it('is a no-op before the member list is loaded', () => {
        const initial = { ...getMembersState([]), value: undefined };

        expect(reducer(initial, upsertMembers([{ member: fromApi('1', 'x') }])).value).toBeUndefined();
    });
});
