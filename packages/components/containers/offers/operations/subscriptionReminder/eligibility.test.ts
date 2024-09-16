import { subDays } from 'date-fns';

import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import isEligible from './eligibility';

const now = new Date();
const fourteenDaysAgo = subDays(now, 14).getTime() / 1000;
const ninetyDaysAgo = subDays(now, 90).getTime() / 1000;
const oneHundreadEightyDaysAgo = subDays(now, 180).getTime() / 1000;

const mailConfig = {
    APP_NAME: APPS.PROTONMAIL,
} as unknown as ProtonConfig;

describe('Subscription reminder eligibility', () => {
    it('should return false if the user is just created', () => {
        const user = {
            isFree: true,
            isDelinquent: false,
            CreateTime: now.getTime() / 1000,
        } as unknown as UserModel;

        expect(isEligible({ user, protonConfig: mailConfig, lastReminderTimestamp: undefined, isVisited: false })).toBe(
            false
        );
    });

    it('should return true if user is older than 14 days and hasnt seen the offer', () => {
        const user = {
            isFree: true,
            isDelinquent: false,
            CreateTime: fourteenDaysAgo,
        } as unknown as UserModel;

        expect(isEligible({ user, protonConfig: mailConfig, lastReminderTimestamp: undefined, isVisited: false })).toBe(
            true
        );
    });

    it('should return false if user is older than 14 days and has seen the offer', () => {
        const user = {
            isFree: true,
            isDelinquent: false,
            CreateTime: fourteenDaysAgo,
        } as unknown as UserModel;

        expect(isEligible({ user, protonConfig: mailConfig, lastReminderTimestamp: undefined, isVisited: true })).toBe(
            false
        );
    });

    it('should return true if user is older than 180 days and has seen the offer', () => {
        const user = {
            isFree: true,
            isDelinquent: false,
            CreateTime: ninetyDaysAgo,
        } as unknown as UserModel;

        expect(isEligible({ user, protonConfig: mailConfig, lastReminderTimestamp: undefined, isVisited: true })).toBe(
            true
        );
    });

    it('should return true if user is older than 360 days and has seen the offer 180 days ago', () => {
        const user = {
            isFree: true,
            isDelinquent: false,
            CreateTime: oneHundreadEightyDaysAgo,
        } as unknown as UserModel;

        expect(
            isEligible({
                user,
                protonConfig: mailConfig,
                lastReminderTimestamp: ninetyDaysAgo,
                isVisited: true,
            })
        ).toBe(true);
    });

    it('should return false if user is older than 180 days but reminder is 14 days old', () => {
        const user = {
            isFree: true,
            isDelinquent: false,
            CreateTime: ninetyDaysAgo,
        } as unknown as UserModel;

        expect(
            isEligible({
                user,
                protonConfig: mailConfig,
                lastReminderTimestamp: fourteenDaysAgo,
                isVisited: true,
            })
        ).toBe(false);
    });
});
