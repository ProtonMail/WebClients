import { CYCLE, PLANS, PLAN_TYPES } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { APPS } from '@proton/shared/lib/constants';

import { getOfferProduct, getPlanRefName } from './getOfferProduct';
import OfferSubscription from './offerSubscription';

const buildOfferSubscription = (plan: PLANS, cycle: CYCLE = CYCLE.YEARLY) => {
    return new OfferSubscription({
        Cycle: cycle,
        Plans: [{ Type: PLAN_TYPES.PLAN, Name: plan }],
    } as unknown as Subscription);
};

describe('getPlanRefName', () => {
    it('returns free with no subscription', () => {
        expect(getPlanRefName(undefined)).toBe('free');
    });

    it.each([
        [PLANS.MAIL, 'mail_plus'],
        [PLANS.DRIVE, 'drive_plus'],
        [PLANS.DRIVE_1TB, 'drive_plus'],
        [PLANS.VPN, 'vpn_plus'],
        [PLANS.VPN2024, 'vpn_plus'],
        [PLANS.PASS, 'pass_plus'],
        [PLANS.BUNDLE, 'unlimited'],
        [PLANS.DUO, 'duo'],
        [PLANS.FAMILY, 'family'],
    ])('maps %s to %s', (plan, expected) => {
        expect(getPlanRefName(buildOfferSubscription(plan))).toBe(expected);
    });

    it('reports a multi-user plan rather than one of its products', () => {
        // Family and Duo include Mail, so a naive check order would report them as mail_plus.
        expect(getPlanRefName(buildOfferSubscription(PLANS.FAMILY))).toBe('family');
        expect(getPlanRefName(buildOfferSubscription(PLANS.DUO))).toBe('duo');
        expect(getPlanRefName(buildOfferSubscription(PLANS.BUNDLE))).toBe('unlimited');
    });
});

describe('getOfferProduct', () => {
    // Mail, Calendar and Drive are each their own app in the ref.
    it.each([
        [APPS.PROTONMAIL, 'mail'],
        [APPS.PROTONCALENDAR, 'calendar'],
        [APPS.PROTONDRIVE, 'drive'],
    ] as const)('maps %s to %s', (appName, expected) => {
        expect(getOfferProduct(appName, '/')).toBe(expected);
    });

    it.each([
        ['/mail/dashboard', 'mail'],
        ['/calendar/dashboard', 'calendar'],
        ['/drive/dashboard', 'drive'],
    ] as const)('resolves the account app under %s to %s', (pathname, expected) => {
        expect(getOfferProduct(APPS.PROTONACCOUNT, pathname)).toBe(expected);
    });

    it('falls back to mail for the account app with no product in the path', () => {
        // Eligibility already excludes this case, so the fallback is a safety net rather than a live path.
        expect(getOfferProduct(APPS.PROTONACCOUNT, '/')).toBe('mail');
    });

    it('ignores the pathname for non-account apps', () => {
        // A drive user viewing a mail-shaped path is still in drive.
        expect(getOfferProduct(APPS.PROTONDRIVE, '/mail/dashboard')).toBe('drive');
    });
});
