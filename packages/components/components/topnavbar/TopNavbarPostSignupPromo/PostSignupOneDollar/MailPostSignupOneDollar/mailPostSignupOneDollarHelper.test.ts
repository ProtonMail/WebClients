import { subDays, subHours } from 'date-fns';

import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { getIsUserEligibleForOneDollar } from './mailPostSignupOneDollarHelper';

const today = new Date();
const protonConfig = { APP_NAME: 'proton-mail' } as unknown as ProtonConfig;

describe('Mail post signup one dollar eligibility', () => {
    describe('Account created after the release', () => {
        it('should be eligible, account 5 hours old', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subHours(today, 5).getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimeStamp: 0,
                    mailPostSignupOneDollarPromoDisabled: false,
                    hasHadSubscription: false,
                })
            ).toBeTruthy();
        });

        it('should be eligible, account 3 days old', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 3).getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimeStamp: 0,
                    mailPostSignupOneDollarPromoDisabled: false,
                    hasHadSubscription: false,
                })
            ).toBeTruthy();
        });

        it('should not be eligible, account 4 hours old', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subHours(today, 4).getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimeStamp: 0,
                    mailPostSignupOneDollarPromoDisabled: false,
                    hasHadSubscription: false,
                })
            ).toBeFalsy();
        });

        it('should not be eligible, account just created', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: today.getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimeStamp: 0,
                    mailPostSignupOneDollarPromoDisabled: false,
                    hasHadSubscription: false,
                })
            ).toBeFalsy();
        });

        it('should be eligible, account 40 days old, offer 30 days', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 40).getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimeStamp: subDays(today, 30).getTime() / 1000,
                    mailPostSignupOneDollarPromoDisabled: false,
                    hasHadSubscription: false,
                })
            ).toBeTruthy();
        });

        it('should not be eligible, account 40 days old, offer 31 days', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 40).getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimeStamp: subDays(today, 31).getTime() / 1000,
                    mailPostSignupOneDollarPromoDisabled: false,
                    hasHadSubscription: false,
                })
            ).toBeFalsy();
        });
    });

    describe('Drive and Mail offer tests', () => {
        it('should not be eligible if Drive offer present', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 3).getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimeStamp: 0,
                    mailPostSignupOneDollarPromoDisabled: false,
                    hasHadSubscription: false,
                    driveOfferStartDateTimestamp: {
                        automaticOfferReminders: 0,
                        offerStartDate: subDays(today.getTime(), 14).getTime() / 1000,
                    },
                })
            ).toBeFalsy();
        });

        it('should not be eligible if Drive offer present and 30 days old', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 3).getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimeStamp: 0,
                    mailPostSignupOneDollarPromoDisabled: false,
                    hasHadSubscription: false,
                    driveOfferStartDateTimestamp: {
                        automaticOfferReminders: 0,
                        offerStartDate: subDays(today.getTime(), 30).getTime() / 1000,
                    },
                })
            ).toBeFalsy();
        });

        it('should be eligible if Drive offer present but is 31 days old', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 3).getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimeStamp: 0,
                    mailPostSignupOneDollarPromoDisabled: false,
                    hasHadSubscription: false,
                    driveOfferStartDateTimestamp: {
                        automaticOfferReminders: 0,
                        offerStartDate: subDays(today.getTime(), 31).getTime() / 1000,
                    },
                })
            ).toBeTruthy();
        });
    });

    describe('Basic eligibilty test', () => {
        it('should be eligible, account met requirements', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 40).getTime() / 1000,
                Flags: { 'pass-lifetime': false },
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimeStamp: subDays(today, 30).getTime() / 1000,
                    mailPostSignupOneDollarPromoDisabled: false,
                    hasHadSubscription: false,
                })
            ).toBeTruthy();
        });

        it('should not be eligible, accont has pass lifetime', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 40).getTime() / 1000,
                Flags: { 'pass-lifetime': true },
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimeStamp: subDays(today, 30).getTime() / 1000,
                    mailPostSignupOneDollarPromoDisabled: false,
                    hasHadSubscription: false,
                })
            ).toBeFalsy();
        });

        it('should not be eligible, flag disabled', () => {
            const nonFreeUser = {
                isFree: false,
                isDelinquent: false,
                CreateTime: subDays(today, 3).getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user: nonFreeUser,
                    protonConfig,
                    offerStartDateTimeStamp: 0,
                    mailPostSignupOneDollarPromoDisabled: true,
                    hasHadSubscription: false,
                })
            ).toBeFalsy();
        });

        it('should not be eligible, previous subscription', () => {
            const nonFreeUser = {
                isFree: false,
                isDelinquent: false,
                CreateTime: subDays(today, 3).getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user: nonFreeUser,
                    protonConfig,
                    offerStartDateTimeStamp: 0,
                    mailPostSignupOneDollarPromoDisabled: true,
                    hasHadSubscription: true,
                })
            ).toBeFalsy();
        });

        it('should not be eligible, not free', () => {
            const nonFreeUser = {
                isFree: false,
                isDelinquent: false,
                CreateTime: subDays(today, 3).getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user: nonFreeUser,
                    protonConfig,
                    offerStartDateTimeStamp: 0,
                    mailPostSignupOneDollarPromoDisabled: false,
                    hasHadSubscription: false,
                })
            ).toBeFalsy();
        });

        it('should not be eligible, delinquent', () => {
            const delinquentUser = {
                isFree: true,
                isDelinquent: true,
                CreateTime: subDays(today, 3).getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user: delinquentUser,
                    protonConfig,
                    offerStartDateTimeStamp: 0,
                    mailPostSignupOneDollarPromoDisabled: false,
                    hasHadSubscription: false,
                })
            ).toBeFalsy();
        });

        it('should not be eligible, wrong app', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 3).getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig: { APP_NAME: 'proton-calendar' } as unknown as ProtonConfig,
                    offerStartDateTimeStamp: 0,
                    mailPostSignupOneDollarPromoDisabled: false,
                    hasHadSubscription: false,
                })
            ).toBeFalsy();
        });
    });
});
