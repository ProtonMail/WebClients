import { PLANS } from '@proton/payments/core/constants';
import type { OrganizationExtended, UserModel } from '@proton/shared/lib/interfaces';

import { getPasswordReminderAccountType } from './getPasswordReminderAccountType';

const makeUser = (overrides: Partial<UserModel> = {}): UserModel => ({ isPrivate: true, ...overrides }) as UserModel;

// A keyful B2B organization that has finished setup.
const configuredOrganization = {
    Name: 'Org',
    PlanName: PLANS.MAIL_PRO,
    RequiresKey: 1,
    HasKeys: 1,
} as OrganizationExtended;

// A keyless B2B organization: `Name` alone marks it as set up.
const configuredKeylessOrganization = {
    Name: 'Org',
    PlanName: PLANS.MAIL_PRO,
    RequiresKey: 0,
    HasKeys: 0,
} as OrganizationExtended;

// A keyful organization whose setup was never completed.
const unfinishedOrganization = {
    Name: 'Org',
    PlanName: PLANS.MAIL_PRO,
    RequiresKey: 1,
    HasKeys: 0,
} as OrganizationExtended;

// What a paying individual gets: an organization object that was never set up.
const unconfiguredOrganization = {
    Name: '',
    PlanName: PLANS.MAIL,
    RequiresKey: 0,
    HasKeys: 0,
} as OrganizationExtended;

describe('getPasswordReminderAccountType', () => {
    describe('individual', () => {
        it('returns individual when there is no organization at all', () => {
            expect(getPasswordReminderAccountType({ user: makeUser(), organization: undefined })).toBe('individual');
        });

        // `isAdmin` is true for any paying account, so this guards against classifying
        // individuals on a paid plan as organization users.
        it('returns individual for a paying admin whose organization was never set up', () => {
            expect(
                getPasswordReminderAccountType({
                    user: makeUser({ isAdmin: true }),
                    organization: unconfiguredOrganization,
                })
            ).toBe('individual');
        });

        it('returns individual for an admin whose keyful organization has no keys yet', () => {
            expect(
                getPasswordReminderAccountType({
                    user: makeUser({ isAdmin: true }),
                    organization: unfinishedOrganization,
                })
            ).toBe('individual');
        });
    });

    describe('organization', () => {
        it.each([
            ['keyful', configuredOrganization],
            ['keyless', configuredKeylessOrganization],
        ])('returns organization for an admin of a configured %s organization', (_label, organization) => {
            expect(getPasswordReminderAccountType({ user: makeUser({ isAdmin: true }), organization })).toBe(
                'organization'
            );
        });

        it('returns organization for a member', () => {
            expect(
                getPasswordReminderAccountType({
                    user: makeUser({ isMember: true }),
                    organization: configuredOrganization,
                })
            ).toBe('organization');
        });

        it('returns organization for a non-private member', () => {
            expect(
                getPasswordReminderAccountType({
                    user: makeUser({ isMember: true, isPrivate: false }),
                    organization: configuredOrganization,
                })
            ).toBe('organization');
        });

        // A member always belongs to an organization, whether or not it has landed in
        // the store yet — unlike an admin, whose classification depends on it.
        it('returns organization for a member before the organization has loaded', () => {
            expect(
                getPasswordReminderAccountType({ user: makeUser({ isMember: true }), organization: undefined })
            ).toBe('organization');
        });
    });

    describe('family', () => {
        it.each([[PLANS.FAMILY], [PLANS.DUO], [PLANS.PASS_FAMILY]])(
            'returns family for a %s group, which is keyless and set up by name',
            (PlanName) => {
                const organization = { Name: 'Family', PlanName, RequiresKey: 0, HasKeys: 0 } as OrganizationExtended;

                expect(getPasswordReminderAccountType({ user: makeUser({ isMember: true }), organization })).toBe(
                    'family'
                );
                expect(getPasswordReminderAccountType({ user: makeUser({ isAdmin: true }), organization })).toBe(
                    'family'
                );
            }
        );
    });
});
