import { PLANS } from '@proton/payments/core/constants';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

import {
    accountAppConfig,
    buildSubscription,
    calendarAppConfig,
    docsAppConfig,
    driveAppConfig,
    eligibleCurrency,
    freeUser,
    ineligibleCurrency,
    mailAppConfig,
    passAppConfig,
    setPathname,
} from './blackFriday2026.test.helpers';
import { configuration as freeToDrivePlusConfig } from './blackFriday2026FreeToDrivePlus/configuration';
import { getIsEligible as isFreeToDrivePlusEligible } from './blackFriday2026FreeToDrivePlus/eligibility';
import { configuration as freeToMailPlusConfig } from './blackFriday2026FreeToMailPlus/configuration';
import { getIsEligible as isFreeToMailPlusEligible } from './blackFriday2026FreeToMailPlus/eligibility';
import { configuration as freeToPassPlusConfig } from './blackFriday2026FreeToPassPlus/configuration';
import { getIsEligible as isFreeToPassPlusEligible } from './blackFriday2026FreeToPassPlus/eligibility';

type Context = [label: string, protonConfig: ProtonConfig, pathname: string];

const MAIL: Context = ['Mail', mailAppConfig, '/'];
const CALENDAR: Context = ['Calendar', calendarAppConfig, '/'];
const DRIVE: Context = ['Drive', driveAppConfig, '/'];
const ACCOUNT_MAIL: Context = ['account /mail/dashboard', accountAppConfig, '/mail/dashboard'];
const ACCOUNT_CALENDAR: Context = ['account /calendar/dashboard', accountAppConfig, '/calendar/dashboard'];
const ACCOUNT_DRIVE: Context = ['account /drive/dashboard', accountAppConfig, '/drive/dashboard'];
const ACCOUNT_PASS: Context = ['account /pass/dashboard', accountAppConfig, '/pass/dashboard'];
const PASS_APP: Context = ['the Pass app', passAppConfig, '/'];
const DOCS_APP: Context = ['the Docs app', docsAppConfig, '/'];
const ACCOUNT_ROOT: Context = ['account with no product', accountAppConfig, '/'];

const ALL_CONTEXTS = [
    MAIL,
    CALENDAR,
    DRIVE,
    ACCOUNT_MAIL,
    ACCOUNT_CALENDAR,
    ACCOUNT_DRIVE,
    ACCOUNT_PASS,
    PASS_APP,
    DOCS_APP,
    ACCOUNT_ROOT,
];

const offers = [
    {
        name: 'free-to-mail-plus',
        getIsEligible: isFreeToMailPlusEligible,
        offerConfig: freeToMailPlusConfig,
        plan: PLANS.MAIL,
        eligibleIn: [MAIL, CALENDAR, ACCOUNT_MAIL, ACCOUNT_CALENDAR],
    },
    {
        name: 'free-to-drive-plus',
        getIsEligible: isFreeToDrivePlusEligible,
        offerConfig: freeToDrivePlusConfig,
        plan: PLANS.DRIVE,
        eligibleIn: [DRIVE, ACCOUNT_DRIVE],
    },
    {
        name: 'free-to-pass-plus',
        getIsEligible: isFreeToPassPlusEligible,
        offerConfig: freeToPassPlusConfig,
        plan: PLANS.PASS,
        eligibleIn: [ACCOUNT_PASS],
    },
];

describe.each(offers)('blackFriday2026 $name eligibility', ({ getIsEligible, offerConfig, plan, eligibleIn }) => {
    const baseProps = {
        user: freeUser,
        offerConfig,
        preferredCurrency: eligibleCurrency,
    };

    it(`offers the ${plan} plan`, () => {
        expect(offerConfig.deals[0].planIDs).toEqual({ [plan]: 1 });
    });

    it.each(ALL_CONTEXTS)('scopes eligibility to its own app in %s', (_, protonConfig, pathname) => {
        setPathname(pathname);

        const expected = eligibleIn.some(([, config, path]) => config === protonConfig && path === pathname);

        expect(getIsEligible({ ...baseProps, protonConfig })).toBe(expected);
    });

    describe('shares the free-user exclusions', () => {
        const [, protonConfig, pathname] = eligibleIn[0];

        beforeEach(() => {
            setPathname(pathname);
        });

        it('is not eligible when delinquent', () => {
            expect(getIsEligible({ ...baseProps, protonConfig, user: { ...freeUser, isDelinquent: true } })).toBe(
                false
            );
        });

        it('is not eligible for a paid user', () => {
            expect(
                getIsEligible({
                    ...baseProps,
                    protonConfig,
                    user: { ...freeUser, isPaid: true, isFree: false },
                    subscription: buildSubscription({ plan: PLANS.MAIL }),
                })
            ).toBe(false);
        });

        it('is not eligible with an ineligible currency', () => {
            expect(getIsEligible({ ...baseProps, protonConfig, preferredCurrency: ineligibleCurrency })).toBe(false);
        });
    });
});
