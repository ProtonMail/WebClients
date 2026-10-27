import { USER_ROLES } from '@proton/shared/lib/constants';

import { getUnreadableSubscriptionsReason } from './unreadable-subscriptions';

const buildUserWithRole = (Role: number) => ({ Role });

const admin = buildUserWithRole(USER_ROLES.ADMIN_ROLE);
const member = buildUserWithRole(USER_ROLES.MEMBER_ROLE);
const freeUser = buildUserWithRole(USER_ROLES.FREE_ROLE);

const subsidiary = { IsSubsidiary: true };
const regularOrganization = { IsSubsidiary: false };

describe('getUnreadableSubscriptionsReason', () => {
    it.each([
        { case: 'admin of an MSP subsidiary', user: admin, organization: subsidiary, expected: 'msp-subsidiary' },
        { case: 'member of an MSP subsidiary', user: member, organization: subsidiary, expected: 'msp-subsidiary' },
        {
            case: 'member of a regular organization',
            user: member,
            organization: regularOrganization,
            expected: 'member',
        },
        { case: 'member whose organization is not loaded', user: member, organization: undefined, expected: 'member' },
        {
            case: 'admin of a regular organization',
            user: admin,
            organization: regularOrganization,
            expected: undefined,
        },
        { case: 'paid user without an organization', user: admin, organization: undefined, expected: undefined },
        { case: 'free user', user: freeUser, organization: undefined, expected: undefined },
    ] as const)('returns $expected for $case', ({ user, organization, expected }) => {
        expect(getUnreadableSubscriptionsReason({ user, organization })).toBe(expected);
    });
});
