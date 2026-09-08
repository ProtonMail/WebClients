import { getUnixTime, subDays, subHours } from 'date-fns';

import type { FreeSubscription } from '@proton/payments/core/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { getIsUserEligibleForZeroNinetyNine } from './mailPostSignup099Helper';

const today = new Date();
const protonConfig = { APP_NAME: APPS.PROTONMAIL } as unknown as ProtonConfig;

const getUser = (overrides: Record<string, unknown> = {}) => {
    return {
        isFree: true,
        isDelinquent: false,
        canPay: true,
        CreateTime: getUnixTime(subDays(today, 400)),
        Flags: {},
        ...overrides,
    } as unknown as UserModel;
};

const freeSubscription = { isFreeSubscription: true } as unknown as FreeSubscription;

const getEligibility = (overrides: Parameters<typeof getIsUserEligibleForZeroNinetyNine>[0] | object = {}) => {
    return getIsUserEligibleForZeroNinetyNine({
        user: getUser(),
        subscription: freeSubscription,
        protonConfig,
        offerStartDateTimeStamp: 0,
        ...overrides,
    } as Parameters<typeof getIsUserEligibleForZeroNinetyNine>[0]);
};

describe('Mail post signup 0.99 eligibility', () => {
    describe('Differences from the one dollar offer', () => {
        it('should be eligible when the user has had a subscription before', () => {
            // The whole point of this promo: a lapsed subscriber is a valid target,
            // whereas the one dollar intro offer excludes them.
            expect(getEligibility({ subscription: freeSubscription })).toBeTruthy();
        });

        it('should be eligible for a brand new account, with no minimum age', () => {
            expect(getEligibility({ user: getUser({ CreateTime: getUnixTime(today) }) })).toBeTruthy();
        });

        it('should be eligible for an account only 1 hour old', () => {
            expect(getEligibility({ user: getUser({ CreateTime: getUnixTime(subHours(today, 1)) }) })).toBeTruthy();
        });
    });

    describe('Basic eligibility', () => {
        it('should be eligible for a free user', () => {
            expect(getEligibility()).toBeTruthy();
        });

        it('should not be eligible for a paid user', () => {
            expect(getEligibility({ user: getUser({ isFree: false }) })).toBeFalsy();
        });

        it('should not be eligible for a delinquent user', () => {
            expect(getEligibility({ user: getUser({ isDelinquent: true }) })).toBeFalsy();
        });

        it('should not be eligible for a user who cannot pay', () => {
            // Covers members of a paid B2B or B2C plan, who must not be upsold directly
            expect(getEligibility({ user: getUser({ canPay: false }) })).toBeFalsy();
        });

        it('should not be eligible for a user with pass lifetime', () => {
            expect(getEligibility({ user: getUser({ Flags: { 'pass-lifetime': true } }) })).toBeFalsy();
        });

        it('should not be eligible with a scheduled subscription', () => {
            const subscription = {
                UpcomingSubscription: { PeriodStart: getUnixTime(today) },
            } as unknown as Subscription;

            expect(getEligibility({ subscription })).toBeFalsy();
        });

        it('should not be eligible outside of Mail', () => {
            expect(
                getEligibility({ protonConfig: { APP_NAME: APPS.PROTONCALENDAR } as unknown as ProtonConfig })
            ).toBeFalsy();
        });

        it('should be eligible in Account when reached from Mail', () => {
            expect(
                getEligibility({
                    protonConfig: { APP_NAME: APPS.PROTONACCOUNT } as unknown as ProtonConfig,
                    parentApp: APPS.PROTONMAIL,
                })
            ).toBeTruthy();
        });
    });

    describe('Offer duration', () => {
        it('should be eligible on day 30 of the offer', () => {
            expect(getEligibility({ offerStartDateTimeStamp: getUnixTime(subDays(today, 30)) })).toBeTruthy();
        });

        it('should not be eligible on day 31 of the offer', () => {
            expect(getEligibility({ offerStartDateTimeStamp: getUnixTime(subDays(today, 31)) })).toBeFalsy();
        });
    });

    describe('Mutual exclusion with the one dollar offer', () => {
        it('should not be eligible while the one dollar offer is running', () => {
            expect(
                getEligibility({
                    oneDollarOfferState: {
                        offerStartDate: getUnixTime(subDays(today, 3)),
                        automaticOfferReminders: 1,
                    },
                })
            ).toBeFalsy();
        });

        it('should be eligible once the one dollar offer has expired', () => {
            expect(
                getEligibility({
                    oneDollarOfferState: {
                        offerStartDate: getUnixTime(subDays(today, 31)),
                        automaticOfferReminders: 3,
                    },
                })
            ).toBeTruthy();
        });

        it('should be eligible when the one dollar offer never started', () => {
            expect(
                getEligibility({
                    oneDollarOfferState: { offerStartDate: 0, automaticOfferReminders: 0 },
                })
            ).toBeTruthy();
        });
    });
});
