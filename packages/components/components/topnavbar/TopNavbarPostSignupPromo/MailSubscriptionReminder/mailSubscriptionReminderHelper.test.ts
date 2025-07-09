import { subDays } from 'date-fns';

import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { AUTOMATIC_OFFER_STATE } from '../PostSignupOneDollar/interface';
import { getIsUserEligibleForSubscriptionReminder } from './mailSubscriptionReminderHelper';

const now = new Date();
const fourteenDaysAgo = subDays(now, 14).getTime() / 1000;
const thirtyDaysAgo = subDays(now, 30).getTime() / 1000;
const fortyFourDaysAgo = subDays(now, 44).getTime() / 1000;
const ninetyDaysAgo = subDays(now, 90).getTime() / 1000;
const oneHundreadEightyDaysAgo = subDays(now, 180).getTime() / 1000;

const mailConfig = {
    APP_NAME: APPS.PROTONMAIL,
} as unknown as ProtonConfig;

describe('Subscription reminder offer', () => {
    it('should return false if the user is just created', () => {
        const user = {
            isFree: true,
            isDelinquent: false,
            CreateTime: now.getTime() / 1000,
        } as unknown as UserModel;

        expect(
            getIsUserEligibleForSubscriptionReminder({
                user,
                protonConfig: mailConfig,
                mailOfferState: {
                    offerStartDate: 0,
                    automaticOfferReminders: AUTOMATIC_OFFER_STATE.notStarted,
                },
                lastReminderTimestamp: undefined,
            })
        ).toBeFalsy();
    });

    it('should return false if the user hasnt finished the one-dollar promo offer', () => {
        const user = {
            isFree: true,
            isDelinquent: false,
            CreateTime: now.getTime() / 1000,
        } as unknown as UserModel;

        expect(
            getIsUserEligibleForSubscriptionReminder({
                user,
                protonConfig: mailConfig,
                mailOfferState: {
                    offerStartDate: fourteenDaysAgo,
                    automaticOfferReminders: AUTOMATIC_OFFER_STATE.secondSpotlight,
                },
                lastReminderTimestamp: undefined,
            })
        ).toBeFalsy();
    });

    it('should return false if the user has finished the one-dollar promo offer 30 days ago', () => {
        const user = {
            isFree: true,
            isDelinquent: false,
            CreateTime: now.getTime() / 1000,
        } as unknown as UserModel;

        expect(
            getIsUserEligibleForSubscriptionReminder({
                user,
                protonConfig: mailConfig,
                mailOfferState: {
                    offerStartDate: thirtyDaysAgo,
                    automaticOfferReminders: AUTOMATIC_OFFER_STATE.secondSpotlight,
                },
                lastReminderTimestamp: undefined,
            })
        ).toBeFalsy();
    });

    it('should return true if the user has finished the one-dollar promo offer 44 days ago', () => {
        const user = {
            isFree: true,
            isDelinquent: false,
            CreateTime: fourteenDaysAgo,
        } as unknown as UserModel;

        expect(
            getIsUserEligibleForSubscriptionReminder({
                user,
                protonConfig: mailConfig,
                mailOfferState: {
                    offerStartDate: fortyFourDaysAgo,
                    automaticOfferReminders: AUTOMATIC_OFFER_STATE.secondSpotlight,
                },
                lastReminderTimestamp: undefined,
            })
        ).toBeTruthy();
    });

    it('should return true if user is older than 180 days and has seen the offer', () => {
        const user = {
            isFree: true,
            isDelinquent: false,
            CreateTime: ninetyDaysAgo,
        } as unknown as UserModel;

        expect(
            getIsUserEligibleForSubscriptionReminder({
                user,
                protonConfig: mailConfig,
                mailOfferState: {
                    offerStartDate: fortyFourDaysAgo,
                    automaticOfferReminders: AUTOMATIC_OFFER_STATE.secondSpotlight,
                },
                lastReminderTimestamp: undefined,
            })
        ).toBeTruthy();
    });

    it('should return true if user is older than 360 days and has seen the offer 180 days ago', () => {
        const user = {
            isFree: true,
            isDelinquent: false,
            CreateTime: oneHundreadEightyDaysAgo,
        } as unknown as UserModel;

        expect(
            getIsUserEligibleForSubscriptionReminder({
                user,
                protonConfig: mailConfig,
                mailOfferState: {
                    offerStartDate: ninetyDaysAgo,
                    automaticOfferReminders: AUTOMATIC_OFFER_STATE.secondSpotlight,
                },
                lastReminderTimestamp: ninetyDaysAgo,
            })
        ).toBeTruthy();
    });

    it('should return false if user is older than 180 days but reminder is 14 days old', () => {
        const user = {
            isFree: true,
            isDelinquent: false,
            CreateTime: ninetyDaysAgo,
        } as unknown as UserModel;

        expect(
            getIsUserEligibleForSubscriptionReminder({
                user,
                protonConfig: mailConfig,
                mailOfferState: {
                    offerStartDate: ninetyDaysAgo,
                    automaticOfferReminders: AUTOMATIC_OFFER_STATE.secondSpotlight,
                },
                lastReminderTimestamp: fourteenDaysAgo,
            })
        ).toBeFalsy();
    });

    it('should return false if user has pass lifetime', () => {
        const user = {
            isFree: true,
            isDelinquent: false,
            CreateTime: oneHundreadEightyDaysAgo,
            Flags: { 'pass-lifetime': true },
        } as unknown as UserModel;

        expect(
            getIsUserEligibleForSubscriptionReminder({
                user,
                protonConfig: mailConfig,
                mailOfferState: {
                    offerStartDate: ninetyDaysAgo,
                    automaticOfferReminders: AUTOMATIC_OFFER_STATE.secondSpotlight,
                },
                lastReminderTimestamp: ninetyDaysAgo,
            })
        ).toBeFalsy();
    });
});
