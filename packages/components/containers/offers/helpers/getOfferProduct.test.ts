import { CYCLE, PLANS, PLAN_TYPES } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

import type { Deal, OfferConfig } from '../interface';
import { getOfferProduct, getPlanRefName } from './getOfferProduct';
import { isCampaignApp } from './isCampaignApp';
import OfferSubscription from './offerSubscription';
import { withResolvedRefs } from './withResolvedRefs';

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

describe('isCampaignApp', () => {
    const config = (APP_NAME: string) => ({ APP_NAME }) as unknown as ProtonConfig;

    it.each([APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE])('allows %s', (appName) => {
        expect(isCampaignApp(config(appName), '/')).toBe(true);
    });

    it.each([APPS.PROTONDOCS, APPS.PROTONVPN_SETTINGS, APPS.PROTONPASS])('excludes %s', (appName) => {
        expect(isCampaignApp(config(appName), '/')).toBe(false);
    });

    it.each(['/mail/dashboard', '/calendar/dashboard', '/drive/dashboard'])(
        'allows the account app under %s',
        (pathname) => {
            expect(isCampaignApp(config(APPS.PROTONACCOUNT), pathname)).toBe(true);
        }
    );

    it.each(['/', '/pass/dashboard', '/vpn/dashboard'])('excludes the account app under %s', (pathname) => {
        expect(isCampaignApp(config(APPS.PROTONACCOUNT), pathname)).toBe(false);
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

describe('withResolvedRefs', () => {
    const buildConfig = (deal: Partial<Deal>): OfferConfig => {
        return { deals: [{ ref: 'fallback', ...deal } as Deal] } as OfferConfig;
    };

    const dynamicConfig = buildConfig({
        ref: 'offer_26_sep_unlimited_duo_mail_web',
        getRef: (product, currentPlan) => `offer_26_sep_${currentPlan}_duo_${product}_web`,
    });

    it('returns the same object when no deal uses getRef', () => {
        const staticConfig = buildConfig({ ref: 'offer_26_sep_free_unlimited_mail_web' });

        // Identity matters: every other offer in the codebase should be untouched.
        expect(withResolvedRefs(staticConfig, APPS.PROTONDRIVE, '/')).toBe(staticConfig);
    });

    it('resolves the ref from the current product and plan', () => {
        const unlimited = buildOfferSubscription(PLANS.BUNDLE);

        expect(withResolvedRefs(dynamicConfig, APPS.PROTONMAIL, '/', unlimited).deals[0].ref).toBe(
            'offer_26_sep_unlimited_duo_mail_web'
        );
        expect(withResolvedRefs(dynamicConfig, APPS.PROTONDRIVE, '/', unlimited).deals[0].ref).toBe(
            'offer_26_sep_unlimited_duo_drive_web'
        );
    });

    it('reports a free user when there is no subscription', () => {
        expect(withResolvedRefs(dynamicConfig, APPS.PROTONMAIL, '/').deals[0].ref).toBe(
            'offer_26_sep_free_duo_mail_web'
        );
    });

    it('resolves the ref from the parent app inside the account app', () => {
        const unlimited = buildOfferSubscription(PLANS.BUNDLE);

        expect(withResolvedRefs(dynamicConfig, APPS.PROTONACCOUNT, '/drive/dashboard', unlimited).deals[0].ref).toBe(
            'offer_26_sep_unlimited_duo_drive_web'
        );
        expect(withResolvedRefs(dynamicConfig, APPS.PROTONACCOUNT, '/mail/dashboard', unlimited).deals[0].ref).toBe(
            'offer_26_sep_unlimited_duo_mail_web'
        );
    });

    it('emits a calendar ref in the calendar app', () => {
        const unlimited = buildOfferSubscription(PLANS.BUNDLE);

        expect(withResolvedRefs(dynamicConfig, APPS.PROTONCALENDAR, '/', unlimited).deals[0].ref).toBe(
            'offer_26_sep_unlimited_duo_calendar_web'
        );
    });

    it('does not mutate the original config', () => {
        withResolvedRefs(dynamicConfig, APPS.PROTONDRIVE, '/', buildOfferSubscription(PLANS.BUNDLE));

        expect(dynamicConfig.deals[0].ref).toBe('offer_26_sep_unlimited_duo_mail_web');
    });
});
