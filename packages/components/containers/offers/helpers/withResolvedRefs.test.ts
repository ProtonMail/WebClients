import { CYCLE, PLANS, PLAN_TYPES } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { APPS } from '@proton/shared/lib/constants';

import type { Deal, OfferConfig } from '../interface';
import OfferSubscription from './offerSubscription';
import { withResolvedRefs } from './withResolvedRefs';

const buildOfferSubscription = (plan: PLANS, cycle: CYCLE = CYCLE.YEARLY) => {
    return new OfferSubscription({
        Cycle: cycle,
        Plans: [{ Type: PLAN_TYPES.PLAN, Name: plan }],
    } as unknown as Subscription);
};

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
