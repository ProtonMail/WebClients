import { subDays } from 'date-fns';

import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { getIsUserEligibleForOneDollar } from './drivePostSignupOneDollarHelper';

const today = new Date();
const protonConfig = { APP_NAME: 'proton-drive' } as unknown as ProtonConfig;

describe('Drive post signup one dollar eligibility', () => {
    describe('Account created after the release', () => {
        it('should be eligible, account 7 days old', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 7).getTime() / 1000,
                ProductUsedSpace: { Drive: 0 },
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimestamp: 0,
                    minimalAccountAgeTimestamp: subDays(today.getTime(), 14).getTime() / 1000,
                    driveOneDollarPostSignupFlag: true,
                    lastSubscriptionEnd: 0,
                    hasUploadedFile: true,
                })
            ).toBeTruthy();
        });

        it('should not be be eligible, account 7 days old but no file uploaded', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 7).getTime() / 1000,
                ProductUsedSpace: { Drive: 0 },
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimestamp: 0,
                    minimalAccountAgeTimestamp: subDays(today.getTime(), 14).getTime() / 1000,
                    driveOneDollarPostSignupFlag: true,
                    lastSubscriptionEnd: 0,
                    hasUploadedFile: false,
                })
            ).toBeFalsy();
        });

        it('should not be eligible, account 6 days old', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 6).getTime() / 1000,
                ProductUsedSpace: { Drive: 0 },
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimestamp: 0,
                    minimalAccountAgeTimestamp: subDays(today.getTime(), 14).getTime() / 1000,
                    driveOneDollarPostSignupFlag: true,
                    lastSubscriptionEnd: 0,
                    hasUploadedFile: true,
                })
            ).toBeFalsy();
        });

        it('should be eligible, account 40 days old, offer 30 days', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 40).getTime() / 1000,
                ProductUsedSpace: { Drive: 0 },
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimestamp: subDays(today, 30).getTime() / 1000,
                    minimalAccountAgeTimestamp: subDays(today.getTime(), 60).getTime() / 1000,
                    driveOneDollarPostSignupFlag: true,
                    lastSubscriptionEnd: 0,
                    hasUploadedFile: true,
                })
            ).toBeTruthy();
        });

        it('should not be eligible, account 40 days old, offer 31 days', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 40).getTime() / 1000,
                ProductUsedSpace: { Drive: 0 },
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimestamp: subDays(today, 31).getTime() / 1000,
                    minimalAccountAgeTimestamp: subDays(today.getTime(), 60).getTime() / 1000,
                    driveOneDollarPostSignupFlag: true,
                    lastSubscriptionEnd: 0,
                    hasUploadedFile: true,
                })
            ).toBeFalsy();
        });
    });

    describe('Mail and Drive offer tests', () => {
        it('should be eligible if no Mail offer', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 7).getTime() / 1000,
                ProductUsedSpace: { Drive: 0 },
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimestamp: 0,
                    minimalAccountAgeTimestamp: subDays(today.getTime(), 14).getTime() / 1000,
                    driveOneDollarPostSignupFlag: true,
                    lastSubscriptionEnd: 0,
                    mailOfferStartDateTimestamp: {
                        automaticOfferReminders: 0,
                        offerStartDate: 0,
                    },
                    hasUploadedFile: true,
                })
            ).toBeTruthy();
        });

        it('should not be eligible if Mail offer present', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 7).getTime() / 1000,
                ProductUsedSpace: { Drive: 0 },
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimestamp: 0,
                    minimalAccountAgeTimestamp: subDays(today.getTime(), 14).getTime() / 1000,
                    driveOneDollarPostSignupFlag: true,
                    lastSubscriptionEnd: 0,
                    mailOfferStartDateTimestamp: {
                        automaticOfferReminders: 0,
                        offerStartDate: subDays(today.getTime(), 14).getTime() / 1000,
                    },
                    hasUploadedFile: true,
                })
            ).toBeFalsy();
        });

        it('should not be eligible if Mail offer present and 30 days old', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 7).getTime() / 1000,
                ProductUsedSpace: { Drive: 0 },
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimestamp: 0,
                    minimalAccountAgeTimestamp: subDays(today.getTime(), 14).getTime() / 1000,
                    driveOneDollarPostSignupFlag: true,
                    lastSubscriptionEnd: 0,
                    mailOfferStartDateTimestamp: {
                        automaticOfferReminders: 0,
                        offerStartDate: subDays(today.getTime(), 30).getTime() / 1000,
                    },
                    hasUploadedFile: true,
                })
            ).toBeFalsy();
        });

        it('should be eligible if Mail offer present but is 31 days old', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 7).getTime() / 1000,
                ProductUsedSpace: { Drive: 0 },
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    offerStartDateTimestamp: 0,
                    minimalAccountAgeTimestamp: subDays(today.getTime(), 14).getTime() / 1000,
                    driveOneDollarPostSignupFlag: true,
                    lastSubscriptionEnd: 0,
                    mailOfferStartDateTimestamp: {
                        automaticOfferReminders: 0,
                        offerStartDate: subDays(today.getTime(), 31).getTime() / 1000,
                    },
                    hasUploadedFile: true,
                })
            ).toBeTruthy();
        });
    });

    describe('Basic eligibilty test', () => {
        it('should not be eligible, flag disabled', () => {
            const nonFreeUser = {
                isFree: false,
                isDelinquent: false,
                CreateTime: today.getTime() / 1000,
                ProductUsedSpace: { Drive: 0 },
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user: nonFreeUser,
                    protonConfig,
                    offerStartDateTimestamp: 0,
                    minimalAccountAgeTimestamp: today.getTime(),
                    driveOneDollarPostSignupFlag: false,
                    lastSubscriptionEnd: 0,
                    hasUploadedFile: true,
                })
            ).toBeFalsy();
        });

        it('should not be eligible, previous subscription', () => {
            const nonFreeUser = {
                isFree: false,
                isDelinquent: false,
                CreateTime: today.getTime() / 1000,
                ProductUsedSpace: { Drive: 0 },
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user: nonFreeUser,
                    protonConfig,
                    offerStartDateTimestamp: 0,
                    minimalAccountAgeTimestamp: today.getTime(),
                    driveOneDollarPostSignupFlag: false,
                    lastSubscriptionEnd: 999,
                    hasUploadedFile: true,
                })
            ).toBeFalsy();
        });

        it('should not be eligible, not free', () => {
            const nonFreeUser = {
                isFree: false,
                isDelinquent: false,
                CreateTime: today.getTime() / 1000,
                ProductUsedSpace: { Drive: 0 },
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user: nonFreeUser,
                    protonConfig,
                    offerStartDateTimestamp: 0,
                    minimalAccountAgeTimestamp: today.getTime(),
                    driveOneDollarPostSignupFlag: true,
                    lastSubscriptionEnd: 0,
                    hasUploadedFile: true,
                })
            ).toBeFalsy();
        });

        it('should not be eligible, delinquent', () => {
            const delinquentUser = {
                isFree: true,
                isDelinquent: true,
                CreateTime: today.getTime() / 1000,
                ProductUsedSpace: { Drive: 0 },
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user: delinquentUser,
                    protonConfig,
                    offerStartDateTimestamp: 0,
                    minimalAccountAgeTimestamp: today.getTime(),
                    driveOneDollarPostSignupFlag: true,
                    lastSubscriptionEnd: 0,
                    hasUploadedFile: true,
                })
            ).toBeFalsy();
        });

        it('should not be eligible, wrong app', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 7).getTime() / 1000,
                ProductUsedSpace: { Drive: 0 },
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig: { APP_NAME: 'proton-calendar' } as unknown as ProtonConfig,
                    offerStartDateTimestamp: 0,
                    minimalAccountAgeTimestamp: today.getTime(),
                    driveOneDollarPostSignupFlag: true,
                    lastSubscriptionEnd: 0,
                    hasUploadedFile: true,
                })
            ).toBeFalsy();
        });
    });
});
