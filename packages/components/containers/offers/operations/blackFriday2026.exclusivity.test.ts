import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import {
    accountAppConfig,
    buildSubscription,
    calendarAppConfig,
    driveAppConfig,
    eligibleCurrency,
    freeUser,
    mailAppConfig,
    paidUser,
    passAppConfig,
    setPathname,
} from './blackFriday2026.test.helpers';
import { configuration as duoToFamilyConfig } from './blackFriday2026DuoToFamily/configuration';
import { getIsEligible as isDuoToFamilyEligible } from './blackFriday2026DuoToFamily/eligibility';
import { configuration as freeToDrivePlusConfig } from './blackFriday2026FreeToDrivePlus/configuration';
import { getIsEligible as isFreeToDrivePlusEligible } from './blackFriday2026FreeToDrivePlus/eligibility';
import { configuration as freeToMailPlusConfig } from './blackFriday2026FreeToMailPlus/configuration';
import { getIsEligible as isFreeToMailPlusEligible } from './blackFriday2026FreeToMailPlus/eligibility';
import { configuration as freeToPassPlusConfig } from './blackFriday2026FreeToPassPlus/configuration';
import { getIsEligible as isFreeToPassPlusEligible } from './blackFriday2026FreeToPassPlus/eligibility';
import { configuration as freeToUnlimitedConfig } from './blackFriday2026FreeToUnlimited/configuration';
import { getIsEligible as isFreeToUnlimitedEligible } from './blackFriday2026FreeToUnlimited/eligibility';
import { configuration as plusToUnlimitedConfig } from './blackFriday2026PlusToUnlimited/configuration';
import { getIsEligible as isPlusToUnlimitedEligible } from './blackFriday2026PlusToUnlimited/eligibility';
import { configuration as unlimitedToDuoConfig } from './blackFriday2026UnlimitedToDuo/configuration';
import { getIsEligible as isUnlimitedToDuoEligible } from './blackFriday2026UnlimitedToDuo/eligibility';

// The paid offers run across both waves, so they are checked against each of them.
const unlimitedToDuo = {
    name: 'unlimited-to-duo',
    getIsEligible: isUnlimitedToDuoEligible,
    offerConfig: unlimitedToDuoConfig,
};

const duoToFamily = {
    name: 'duo-to-family',
    getIsEligible: isDuoToFamilyEligible,
    offerConfig: duoToFamilyConfig,
};

const plusToUnlimited = {
    name: 'plus-to-unlimited',
    getIsEligible: isPlusToUnlimitedEligible,
    offerConfig: plusToUnlimitedConfig,
};

const waves = {
    'wave 1': [
        unlimitedToDuo,
        duoToFamily,
        plusToUnlimited,
        { name: 'free-to-unlimited', getIsEligible: isFreeToUnlimitedEligible, offerConfig: freeToUnlimitedConfig },
    ],
    'wave 2': [
        unlimitedToDuo,
        duoToFamily,
        plusToUnlimited,
        { name: 'free-to-mail-plus', getIsEligible: isFreeToMailPlusEligible, offerConfig: freeToMailPlusConfig },
        { name: 'free-to-drive-plus', getIsEligible: isFreeToDrivePlusEligible, offerConfig: freeToDrivePlusConfig },
        { name: 'free-to-pass-plus', getIsEligible: isFreeToPassPlusEligible, offerConfig: freeToPassPlusConfig },
    ],
};

type Wave = keyof typeof waves;

const getMatchingOperations = (
    wave: Wave,
    user: UserModel,
    subscription?: Subscription,
    protonConfig: ProtonConfig = mailAppConfig
) => {
    return waves[wave]
        .filter(({ getIsEligible, offerConfig }) => {
            return getIsEligible({
                user,
                subscription,
                protonConfig,
                offerConfig,
                preferredCurrency: eligibleCurrency,
            });
        })
        .map(({ name }) => name);
};

/**
 * Both waves target free users, so they would collide if switched on together. They are separated in
 * time by the Offers feature instead. Within a wave, the audiences are separated by plan or by app, so
 * any given user should match at most one offer.
 *
 * Two offers in the same wave matching one user would mean whichever is ordered first in
 * useBlackFriday2026() silently wins, which is an eligibility bug rather than an ordering preference.
 */
describe('blackFriday2026 offers are mutually exclusive within a wave', () => {
    beforeEach(() => {
        setPathname('/');
    });

    describe('wave 1', () => {
        it('matches only free-to-unlimited for a free user', () => {
            expect(getMatchingOperations('wave 1', freeUser)).toEqual(['free-to-unlimited']);
        });
    });

    describe('wave 2', () => {
        it.each([
            ['Mail', mailAppConfig, '/', 'free-to-mail-plus'],
            ['Calendar', calendarAppConfig, '/', 'free-to-mail-plus'],
            ['Drive', driveAppConfig, '/', 'free-to-drive-plus'],
            ['the account app', accountAppConfig, '/mail/dashboard', 'free-to-mail-plus'],
            ['the account app', accountAppConfig, '/calendar/dashboard', 'free-to-mail-plus'],
            ['the account app', accountAppConfig, '/drive/dashboard', 'free-to-drive-plus'],
            ['the account app', accountAppConfig, '/pass/dashboard', 'free-to-pass-plus'],
        ])('matches only one offer for a free user in %s under %s', (_, protonConfig, pathname, expected) => {
            setPathname(pathname);

            expect(getMatchingOperations('wave 2', freeUser, undefined, protonConfig)).toEqual([expected]);
        });

        it('matches nothing inside the Pass app itself', () => {
            expect(getMatchingOperations('wave 2', freeUser, undefined, passAppConfig)).toEqual([]);
        });
    });

    describe.each(Object.keys(waves) as Wave[])('%s: paid users', (wave) => {
        it.each([PLANS.MAIL, PLANS.DRIVE, PLANS.DRIVE_1TB, PLANS.VPN, PLANS.VPN2024, PLANS.PASS])(
            'matches only plus-to-unlimited for a %s user',
            (plan) => {
                expect(getMatchingOperations(wave, paidUser, buildSubscription({ plan, cycle: CYCLE.YEARLY }))).toEqual(
                    ['plus-to-unlimited']
                );
            }
        );

        it.each([CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS])(
            'matches only unlimited-to-duo for an Unlimited user on cycle %s',
            (cycle) => {
                expect(getMatchingOperations(wave, paidUser, buildSubscription({ plan: PLANS.BUNDLE, cycle }))).toEqual(
                    ['unlimited-to-duo']
                );
            }
        );

        it.each([CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS])(
            'matches only duo-to-family for a Duo user on cycle %s',
            (cycle) => {
                expect(getMatchingOperations(wave, paidUser, buildSubscription({ plan: PLANS.DUO, cycle }))).toEqual([
                    'duo-to-family',
                ]);
            }
        );

        it.each([PLANS.FAMILY, PLANS.VISIONARY])('matches nothing for a %s user', (plan) => {
            expect(getMatchingOperations(wave, paidUser, buildSubscription({ plan, cycle: CYCLE.YEARLY }))).toEqual([]);
        });
    });
});
