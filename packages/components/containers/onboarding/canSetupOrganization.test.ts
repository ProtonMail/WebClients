import { describe, expect, it } from 'vitest';

import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { canSetupOrganization } from './canSetupOrganization';

const base = {
    user: { isAdmin: true },
    organization: { MaxMembers: 5, UsedMembers: 1, HasKeys: 0 },
    subscription: buildSubscription(PLANS.MAIL_PRO),
};

describe('canSetupOrganization', () => {
    it('is true for the admin of a multi-user organization that is not set up', () => {
        expect(canSetupOrganization(base)).toBe(true);
    });

    it('is false for a regular single-user account', () => {
        expect(
            canSetupOrganization({
                ...base,
                organization: { MaxMembers: 1, UsedMembers: 1, HasKeys: 0 },
            })
        ).toBe(false);
        expect(canSetupOrganization({ ...base, organization: undefined })).toBe(false);
    });

    it('is false for a non-admin', () => {
        expect(canSetupOrganization({ ...base, user: { isAdmin: false } })).toBe(false);
    });

    it('is false once members were added or keys were set up', () => {
        expect(
            canSetupOrganization({
                ...base,
                organization: { ...base.organization, UsedMembers: 2 },
            })
        ).toBe(false);
        expect(
            canSetupOrganization({
                ...base,
                organization: { ...base.organization, HasKeys: 1 },
            })
        ).toBe(false);
    });

    it('is false for a Visionary subscription', () => {
        const subscription = buildSubscription(PLANS.VISIONARY);
        expect(canSetupOrganization({ ...base, subscription })).toBe(false);
    });
});
