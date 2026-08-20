import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { UserModel } from '@proton/shared/lib/interfaces';

import {
    buildSubscription,
    eligibleCurrency,
    freeUser,
    mailAppConfig,
    paidUser,
    setPathname,
} from './q3Sale2026.test.helpers';
import { configuration as duoToFamilyConfig } from './q3Sale2026DuoToFamily/configuration';
import { getIsEligible as isDuoToFamilyEligible } from './q3Sale2026DuoToFamily/eligibility';
import { configuration as familyMonthlyToYearlyConfig } from './q3Sale2026FamilyMonthlyToYearly/configuration';
import { getIsEligible as isFamilyMonthlyToYearlyEligible } from './q3Sale2026FamilyMonthlyToYearly/eligibility';
import { configuration as freeToUnlimitedConfig } from './q3Sale2026FreeToUnlimited/configuration';
import { getIsEligible as isFreeToUnlimitedEligible } from './q3Sale2026FreeToUnlimited/eligibility';
import { configuration as plusToUnlimitedConfig } from './q3Sale2026PlusToUnlimited/configuration';
import { getIsEligible as isPlusToUnlimitedEligible } from './q3Sale2026PlusToUnlimited/eligibility';
import { configuration as unlimitedToDuoConfig } from './q3Sale2026UnlimitedToDuo/configuration';
import { getIsEligible as isUnlimitedToDuoEligible } from './q3Sale2026UnlimitedToDuo/eligibility';

const operations = [
    { name: 'free-to-unlimited', getIsEligible: isFreeToUnlimitedEligible, offerConfig: freeToUnlimitedConfig },
    { name: 'plus-to-unlimited', getIsEligible: isPlusToUnlimitedEligible, offerConfig: plusToUnlimitedConfig },
    { name: 'unlimited-to-duo', getIsEligible: isUnlimitedToDuoEligible, offerConfig: unlimitedToDuoConfig },
    { name: 'duo-to-family', getIsEligible: isDuoToFamilyEligible, offerConfig: duoToFamilyConfig },
    {
        name: 'family-monthly-to-yearly',
        getIsEligible: isFamilyMonthlyToYearlyEligible,
        offerConfig: familyMonthlyToYearlyConfig,
    },
];

const getMatchingOperations = (user: UserModel, subscription?: Subscription) => {
    return operations
        .filter(({ getIsEligible, offerConfig }) => {
            return getIsEligible({
                user,
                subscription,
                protonConfig: mailAppConfig,
                offerConfig,
                preferredCurrency: eligibleCurrency,
            });
        })
        .map(({ name }) => name);
};

/**
 * All five offers share the same app scope (Mail, Calendar, Drive and their account dashboards), so
 * within that scope the audiences are separated purely by plan: Unlimited / Duo / Family monthly /
 * single-product paid / free. Any given user should match exactly one offer.
 *
 * Two offers matching the same user would mean whichever is ordered first in useQ3Sale2026() silently
 * wins, which is an eligibility bug rather than an ordering preference.
 */
describe('q3Sale2026 offers are mutually exclusive', () => {
    beforeEach(() => {
        setPathname('/');
    });

    it('matches only free-to-unlimited for a free user', () => {
        expect(getMatchingOperations(freeUser)).toEqual(['free-to-unlimited']);
    });

    it.each([PLANS.MAIL, PLANS.DRIVE, PLANS.DRIVE_1TB, PLANS.VPN, PLANS.VPN2024, PLANS.PASS])(
        'matches only plus-to-unlimited for a %s user',
        (plan) => {
            expect(getMatchingOperations(paidUser, buildSubscription({ plan }))).toEqual(['plus-to-unlimited']);
        }
    );

    it.each([CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS])(
        'matches only unlimited-to-duo for an Unlimited user on cycle %s',
        (cycle) => {
            expect(getMatchingOperations(paidUser, buildSubscription({ plan: PLANS.BUNDLE, cycle }))).toEqual([
                'unlimited-to-duo',
            ]);
        }
    );

    it.each([CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS])(
        'matches only duo-to-family for a Duo user on cycle %s',
        (cycle) => {
            expect(getMatchingOperations(paidUser, buildSubscription({ plan: PLANS.DUO, cycle }))).toEqual([
                'duo-to-family',
            ]);
        }
    );

    it('matches only family-monthly-to-yearly for a monthly Family user', () => {
        expect(
            getMatchingOperations(paidUser, buildSubscription({ plan: PLANS.FAMILY, cycle: CYCLE.MONTHLY }))
        ).toEqual(['family-monthly-to-yearly']);
    });

    describe('nobody is eligible', () => {
        it.each([CYCLE.YEARLY, CYCLE.TWO_YEARS])('matches nothing for a Family user on cycle %s', (cycle) => {
            expect(getMatchingOperations(paidUser, buildSubscription({ plan: PLANS.FAMILY, cycle }))).toEqual([]);
        });

        it('matches nothing for a visionary user', () => {
            expect(getMatchingOperations(paidUser, buildSubscription({ plan: PLANS.VISIONARY }))).toEqual([]);
        });
    });
});
