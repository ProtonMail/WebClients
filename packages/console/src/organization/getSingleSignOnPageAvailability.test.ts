import { PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { APPS } from '@proton/shared/lib/constants';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';

import { getSingleSignOnPageAvailability } from './getSingleSignOnPageAvailability';

// The plan, flag and organization cases run through Account's `routes.test.ts`, which calls the same function.
const organization = { RequiresKey: 1, HasKeys: 1 } as OrganizationExtended;

const getSubscriptions = (planName: PLANS) => [{ Plans: [{ Name: planName }] }] as Subscription[];

const getAvailability = ({
    planName,
    hasSso,
    canReadSsoConfig = true,
}: {
    planName: PLANS;
    hasSso: boolean;
    canReadSsoConfig?: boolean;
}) =>
    getSingleSignOnPageAvailability({
        app: APPS.PROTONCONSOLE,
        organization,
        entitlements: { hasSso },
        permissions: { 'account.sso_config.read': canReadSsoConfig },
        allSubscriptions: getSubscriptions(planName),
        isSsoForPbsEnabled: false,
    });

describe('getSingleSignOnPageAvailability in Console', () => {
    it('shows the page with the upsell on Pass Essentials', () => {
        expect(getAvailability({ planName: PLANS.PASS_PRO, hasSso: false })).toEqual({
            singleSignOn: true,
            upgradeRequired: true,
        });
    });

    it('shows the setup with the sso entitlement', () => {
        expect(getAvailability({ planName: PLANS.PASS_BUSINESS, hasSso: true })).toEqual({
            singleSignOn: true,
            upgradeRequired: false,
        });
    });

    it('hides the page without the permission', () => {
        expect(
            getAvailability({ planName: PLANS.PASS_BUSINESS, hasSso: true, canReadSsoConfig: false }).singleSignOn
        ).toBe(false);
    });
});
