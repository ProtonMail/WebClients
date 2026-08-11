import { CYCLE, PLANS, PLAN_TYPES } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

import OfferSubscription from '../helpers/offerSubscription';
import { withResolvedRefs } from '../helpers/withResolvedRefs';
import type { OfferConfig } from '../interface';
import { configuration as duoToFamily } from './q3Sale2026DuoToFamily/configuration';
import { configuration as familyMonthlyToYearly } from './q3Sale2026FamilyMonthlyToYearly/configuration';
import { configuration as freeToUnlimited } from './q3Sale2026FreeToUnlimited/configuration';
import { configuration as plusToUnlimited } from './q3Sale2026PlusToUnlimited/configuration';
import { configuration as unlimitedToDuo } from './q3Sale2026UnlimitedToDuo/configuration';

const configurations = [
    { name: 'free-to-unlimited', configuration: freeToUnlimited },
    { name: 'plus-to-unlimited', configuration: plusToUnlimited },
    { name: 'unlimited-to-duo', configuration: unlimitedToDuo },
    { name: 'duo-to-family', configuration: duoToFamily },
    { name: 'family-monthly-to-yearly', configuration: familyMonthlyToYearly },
];

const buildOfferSubscription = (plan: PLANS, cycle: CYCLE = CYCLE.YEARLY) => {
    return new OfferSubscription({
        Cycle: cycle,
        Plans: [{ Type: PLAN_TYPES.PLAN, Name: plan }],
    } as unknown as Subscription);
};

/**
 * Guards the wiring rather than the templates. `getRef` lives on the entry in q3Sale2026offers.ts, but
 * it only has any effect if each operation's configuration.ts destructures it *and* passes it onto the
 * deal. Miss either step and withResolvedRefs silently returns the config untouched, so every offer
 * falls back to its static `ref` and the app/plan segments never vary.
 *
 * That exact bug shipped once: the templates were unit-tested in isolation and passed, while the
 * feature did nothing in the app.
 */
describe('q3Sale2026 ref wiring', () => {
    it.each(configurations)('$name passes getRef through to its deal', ({ configuration }) => {
        expect(configuration.deals[0].getRef).toBeDefined();
    });

    it.each(configurations)('$name resolves a real ref through withResolvedRefs', ({ configuration }) => {
        const resolved = withResolvedRefs(configuration, APPS.PROTONDRIVE, '/', buildOfferSubscription(PLANS.DRIVE));

        // The static fallback always ends in _mail_web, so a drive ref proves resolution actually ran.
        expect(resolved.deals[0].ref).toMatch(/_drive_web$/);
        expect(resolved.deals[0].ref).not.toBe(configuration.deals[0].ref);
    });

    it('varies the app segment across all three campaign apps', () => {
        const subscription = buildOfferSubscription(PLANS.BUNDLE);

        const refFor = (appName: Parameters<typeof withResolvedRefs>[1]) => {
            return withResolvedRefs(unlimitedToDuo, appName, '/', subscription).deals[0].ref;
        };

        expect(refFor(APPS.PROTONMAIL)).toBe('offer_26_sep_unlimited_duo_mail_web');
        expect(refFor(APPS.PROTONCALENDAR)).toBe('offer_26_sep_unlimited_duo_calendar_web');
        expect(refFor(APPS.PROTONDRIVE)).toBe('offer_26_sep_unlimited_duo_drive_web');
    });

    it.each(configurations)('$name returns feature bullets after resolution', ({ configuration }) => {
        const resolved = withResolvedRefs(configuration, APPS.PROTONDRIVE, '/', buildOfferSubscription(PLANS.DRIVE));

        expect(resolved.deals[0].features?.()?.length).toBeGreaterThan(0);
    });

    it('gives Drive its own Unlimited copy but keeps Duo and Family copy shared', () => {
        const subscription = buildOfferSubscription(PLANS.DRIVE);

        const featuresFor = (configuration: OfferConfig, appName: APP_NAMES) => {
            return withResolvedRefs(configuration, appName, '/', subscription).deals[0].features?.();
        };

        const mailUnlimited = featuresFor(plusToUnlimited, APPS.PROTONMAIL);
        const driveUnlimited = featuresFor(plusToUnlimited, APPS.PROTONDRIVE);
        expect(driveUnlimited).not.toEqual(mailUnlimited);

        // Duo and Family bullets describe the plan, so they are identical across apps for now.
        expect(featuresFor(duoToFamily, APPS.PROTONDRIVE)).toEqual(featuresFor(duoToFamily, APPS.PROTONMAIL));
        expect(featuresFor(familyMonthlyToYearly, APPS.PROTONDRIVE)).toEqual(
            featuresFor(familyMonthlyToYearly, APPS.PROTONMAIL)
        );
    });

    it('varies the current plan segment for the same offer', () => {
        const refFor = (plan: PLANS) => {
            return withResolvedRefs(plusToUnlimited, APPS.PROTONMAIL, '/', buildOfferSubscription(plan)).deals[0].ref;
        };

        expect(refFor(PLANS.MAIL)).toBe('offer_26_sep_mail_plus_unlimited_mail_web');
        expect(refFor(PLANS.DRIVE)).toBe('offer_26_sep_drive_plus_unlimited_mail_web');
        expect(refFor(PLANS.PASS)).toBe('offer_26_sep_pass_plus_unlimited_mail_web');
    });
});
