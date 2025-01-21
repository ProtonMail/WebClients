import { subDays } from 'date-fns';

import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { getIsUserEligibleForOneDollar } from './mailPostSignupOneDollarHelper';

const today = new Date();
const protonConfig = { APP_NAME: 'proton-mail' } as unknown as ProtonConfig;

describe('Mail post signup one dollar eligibility', () => {
    describe('Account created after the release', () => {
        it('should be eligible, account 7 days old', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 7).getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    postSignupTimestamp: 0,
                    postSignupThreshold: subDays(today.getTime(), 14).getTime() / 1000,
                    mailOneDollarPostSignupFlag: true,
                    totalMessage: 10,
                })
            ).toBeTruthy();
        });

        it('should not be eligible, account 7 days old but 5 messages', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 7).getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    postSignupTimestamp: 0,
                    postSignupThreshold: subDays(today.getTime(), 14).getTime() / 1000,
                    mailOneDollarPostSignupFlag: true,
                    totalMessage: 5,
                })
            ).toBeFalsy();
        });

        it('should not be eligible, account 6 days old', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 6).getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig,
                    postSignupTimestamp: 0,
                    postSignupThreshold: subDays(today.getTime(), 14).getTime() / 1000,
                    mailOneDollarPostSignupFlag: true,
                    totalMessage: 10,
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
                    postSignupTimestamp: subDays(today, 30).getTime() / 1000,
                    postSignupThreshold: subDays(today.getTime(), 60).getTime() / 1000,
                    mailOneDollarPostSignupFlag: true,
                    totalMessage: 10,
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
                    postSignupTimestamp: subDays(today, 31).getTime() / 1000,
                    postSignupThreshold: subDays(today.getTime(), 60).getTime() / 1000,
                    mailOneDollarPostSignupFlag: true,
                    totalMessage: 10,
                })
            ).toBeFalsy();
        });
    });

    describe('Basic eligibilty test', () => {
        it('should not be eligible, flag disabled', () => {
            const nonFreeUser = {
                isFree: false,
                isDelinquent: false,
                CreateTime: today.getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user: nonFreeUser,
                    protonConfig,
                    postSignupTimestamp: 0,
                    postSignupThreshold: today.getTime(),
                    mailOneDollarPostSignupFlag: false,
                    totalMessage: 10,
                })
            ).toBeFalsy();
        });

        it('should not be eligible, not free', () => {
            const nonFreeUser = {
                isFree: false,
                isDelinquent: false,
                CreateTime: today.getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user: nonFreeUser,
                    protonConfig,
                    postSignupTimestamp: 0,
                    postSignupThreshold: today.getTime(),
                    mailOneDollarPostSignupFlag: true,
                    totalMessage: 10,
                })
            ).toBeFalsy();
        });

        it('should not be eligible, delinquent', () => {
            const delinquentUser = {
                isFree: true,
                isDelinquent: true,
                CreateTime: today.getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user: delinquentUser,
                    protonConfig,
                    postSignupTimestamp: 0,
                    postSignupThreshold: today.getTime(),
                    mailOneDollarPostSignupFlag: true,
                    totalMessage: 10,
                })
            ).toBeFalsy();
        });

        it('should not be eligible, wrong app', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: subDays(today, 7).getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligibleForOneDollar({
                    user,
                    protonConfig: { APP_NAME: 'proton-calendar' } as unknown as ProtonConfig,
                    postSignupTimestamp: 0,
                    postSignupThreshold: today.getTime(),
                    mailOneDollarPostSignupFlag: true,
                    totalMessage: 10,
                })
            ).toBeFalsy();
        });
    });
});
