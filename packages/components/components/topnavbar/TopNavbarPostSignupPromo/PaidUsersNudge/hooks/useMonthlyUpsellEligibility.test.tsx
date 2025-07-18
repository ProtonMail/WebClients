import { subDays } from 'date-fns';

import { useSubscription } from '@proton/account/subscription/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import useFeature from '@proton/features/useFeature';
import { CYCLE, PLANS, type Subscription, SubscriptionPlatform } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';

import { HIDE_OFFER } from '../helpers/interface';
import { paidConfig } from '../montlyPaidUserNudgeConfig';
import { useMonthlyUpsellEligibility } from './useMonthlyUpsellEligibility';

jest.mock('@proton/account/subscription/hooks');
const mockUseSubscription = useSubscription as jest.Mock;

jest.mock('@proton/features/useFeature');
const mockUseFeature = useFeature as jest.Mock;

jest.mock('@proton/components/hooks/useConfig');
const mockUseConfig = useConfig as jest.Mock;

jest.mock('@proton/unleash/useFlag');
const mockUseFlag = useFlag as jest.Mock;

const today = new Date();
const defaultSubscription = {
    PeriodStart: subDays(today.getTime(), 25).getTime() / 1000,
    Cycle: CYCLE.MONTHLY,
    Plans: [{ Name: PLANS.MAIL }],
};

const defaultConfigMail = {
    APP_NAME: APPS.PROTONMAIL,
};

const featureEnabled = {
    feature: { Value: 0 },
};

const featureHidden = {
    feature: { Value: HIDE_OFFER },
};

describe('Mail Paid user nudge', () => {
    afterEach(() => {
        mockUseSubscription.mockClear();
        mockUseFeature.mockClear();
        mockUseConfig.mockClear();
        mockUseFlag.mockClear();
    });

    describe('Short return tests', () => {
        it('Should return false if the user hid the offer', () => {
            mockUseSubscription.mockReturnValue([defaultSubscription]);
            mockUseConfig.mockReturnValue(defaultConfigMail);
            mockUseFlag.mockReturnValue(true);
            mockUseFeature.mockReturnValue(featureHidden);

            expect(
                useMonthlyUpsellEligibility({
                    allowedApps: paidConfig[PLANS.MAIL].allowedApps,
                    offerTimestampFlag: paidConfig[PLANS.MAIL].offerTimestampFlag,
                    offerFlag: paidConfig[PLANS.MAIL].offerFlag,
                    eligiblePlan: paidConfig[PLANS.MAIL].currentPlan,
                })
            ).toBe(false);
        });

        it('Should return false since the flag is disabled', () => {
            mockUseSubscription.mockReturnValue([defaultSubscription]);
            mockUseConfig.mockReturnValue(defaultConfigMail);
            mockUseFlag.mockReturnValue(false);
            mockUseFeature.mockReturnValue(featureEnabled);

            expect(
                useMonthlyUpsellEligibility({
                    allowedApps: paidConfig[PLANS.MAIL].allowedApps,
                    offerTimestampFlag: paidConfig[PLANS.MAIL].offerTimestampFlag,
                    offerFlag: paidConfig[PLANS.MAIL].offerFlag,
                    eligiblePlan: paidConfig[PLANS.MAIL].currentPlan,
                })
            ).toBe(false);
        });

        it('Should return false since the subscription is empty', () => {
            mockUseSubscription.mockReturnValue([null]);
            mockUseConfig.mockReturnValue(defaultConfigMail);
            mockUseFlag.mockReturnValue(true);
            mockUseFeature.mockReturnValue(featureEnabled);

            expect(
                useMonthlyUpsellEligibility({
                    allowedApps: paidConfig[PLANS.MAIL].allowedApps,
                    offerTimestampFlag: paidConfig[PLANS.MAIL].offerTimestampFlag,
                    offerFlag: paidConfig[PLANS.MAIL].offerFlag,
                    eligiblePlan: paidConfig[PLANS.MAIL].currentPlan,
                })
            ).toBe(false);
        });

        it('Should return false if the app is not in allow list', () => {
            mockUseSubscription.mockReturnValue([null]);
            mockUseConfig.mockReturnValue({
                APP_NAME: APPS.PROTONDRIVE,
            });
            mockUseFlag.mockReturnValue(true);
            mockUseFeature.mockReturnValue(featureEnabled);

            expect(
                useMonthlyUpsellEligibility({
                    allowedApps: paidConfig[PLANS.MAIL].allowedApps,
                    offerTimestampFlag: paidConfig[PLANS.MAIL].offerTimestampFlag,
                    offerFlag: paidConfig[PLANS.MAIL].offerFlag,
                    eligiblePlan: paidConfig[PLANS.MAIL].currentPlan,
                })
            ).toBe(false);
        });
    });

    describe('Valid app tests', () => {
        it('Should return false because the app is not valid', () => {
            mockUseSubscription.mockReturnValue([defaultSubscription]);
            mockUseFeature.mockReturnValue(featureEnabled);
            mockUseFlag.mockReturnValue(true);
            mockUseConfig.mockReturnValue({
                APP_NAME: APPS.PROTONDRIVE,
            });

            expect(
                useMonthlyUpsellEligibility({
                    allowedApps: paidConfig[PLANS.MAIL].allowedApps,
                    offerTimestampFlag: paidConfig[PLANS.MAIL].offerTimestampFlag,
                    offerFlag: paidConfig[PLANS.MAIL].offerFlag,
                    eligiblePlan: paidConfig[PLANS.MAIL].currentPlan,
                })
            ).toBe(false);
        });

        it('Should return true because the app is valid', () => {
            mockUseSubscription.mockReturnValue([defaultSubscription]);
            mockUseFeature.mockReturnValue(featureEnabled);
            mockUseFlag.mockReturnValue(true);
            mockUseConfig.mockReturnValue({
                APP_NAME: APPS.PROTONMAIL,
            });

            expect(
                useMonthlyUpsellEligibility({
                    allowedApps: paidConfig[PLANS.MAIL].allowedApps,
                    offerTimestampFlag: paidConfig[PLANS.MAIL].offerTimestampFlag,
                    offerFlag: paidConfig[PLANS.MAIL].offerFlag,
                    eligiblePlan: paidConfig[PLANS.MAIL].currentPlan,
                })
            ).toBe(true);
        });
    });

    describe('Subscription tests', () => {
        it('Should return false because user is not monthly', () => {
            mockUseFeature.mockReturnValue(featureEnabled);
            mockUseConfig.mockReturnValue(defaultConfigMail);
            mockUseFlag.mockReturnValue(true);
            mockUseSubscription.mockReturnValue([
                {
                    PeriodStart: subDays(today.getTime(), 25).getTime() / 1000,
                    Cycle: CYCLE.YEARLY,
                    Plans: [{ Name: PLANS.MAIL }],
                } as unknown as Subscription,
            ]);

            expect(
                useMonthlyUpsellEligibility({
                    allowedApps: paidConfig[PLANS.MAIL].allowedApps,
                    offerTimestampFlag: paidConfig[PLANS.MAIL].offerTimestampFlag,
                    offerFlag: paidConfig[PLANS.MAIL].offerFlag,
                    eligiblePlan: paidConfig[PLANS.MAIL].currentPlan,
                })
            ).toBe(false);
        });

        it('Should return false because user has upcoming yearly subcription', () => {
            mockUseFeature.mockReturnValue(featureEnabled);
            mockUseConfig.mockReturnValue(defaultConfigMail);
            mockUseFlag.mockReturnValue(true);
            mockUseSubscription.mockReturnValue([
                {
                    PeriodStart: subDays(today.getTime(), 25).getTime() / 1000,
                    Cycle: CYCLE.MONTHLY,
                    Plans: [{ Name: PLANS.MAIL }],
                    UpcomingSubscription: { Cycle: CYCLE.YEARLY },
                } as unknown as Subscription,
            ]);

            expect(
                useMonthlyUpsellEligibility({
                    allowedApps: paidConfig[PLANS.MAIL].allowedApps,
                    offerTimestampFlag: paidConfig[PLANS.MAIL].offerTimestampFlag,
                    offerFlag: paidConfig[PLANS.MAIL].offerFlag,
                    eligiblePlan: paidConfig[PLANS.MAIL].currentPlan,
                })
            ).toBe(false);
        });

        it('Should return false because the user is not in the window', () => {
            mockUseFeature.mockReturnValue(featureEnabled);
            mockUseConfig.mockReturnValue(defaultConfigMail);
            mockUseFlag.mockReturnValue(true);
            mockUseSubscription.mockReturnValue([
                {
                    PeriodStart: subDays(today.getTime(), 19).getTime() / 1000,
                    Cycle: CYCLE.MONTHLY,
                    Plans: [{ Name: PLANS.MAIL }],
                    UpcomingSubscription: { Cycle: CYCLE.MONTHLY },
                } as unknown as Subscription,
            ]);

            expect(
                useMonthlyUpsellEligibility({
                    allowedApps: paidConfig[PLANS.MAIL].allowedApps,
                    offerTimestampFlag: paidConfig[PLANS.MAIL].offerTimestampFlag,
                    offerFlag: paidConfig[PLANS.MAIL].offerFlag,
                    eligiblePlan: paidConfig[PLANS.MAIL].currentPlan,
                })
            ).toBe(false);
        });

        it('Should return false because the user has a mobile subscription', () => {
            mockUseFeature.mockReturnValue(featureEnabled);
            mockUseConfig.mockReturnValue(defaultConfigMail);
            mockUseFlag.mockReturnValue(true);
            mockUseSubscription.mockReturnValue([
                {
                    PeriodStart: subDays(today.getTime(), 25).getTime() / 1000,
                    Cycle: CYCLE.MONTHLY,
                    Plans: [{ Name: PLANS.MAIL }],
                    UpcomingSubscription: { Cycle: CYCLE.MONTHLY },
                    External: SubscriptionPlatform.Android,
                } as unknown as Subscription,
            ]);

            expect(
                useMonthlyUpsellEligibility({
                    allowedApps: paidConfig[PLANS.MAIL].allowedApps,
                    offerTimestampFlag: paidConfig[PLANS.MAIL].offerTimestampFlag,
                    offerFlag: paidConfig[PLANS.MAIL].offerFlag,
                    eligiblePlan: paidConfig[PLANS.MAIL].currentPlan,
                })
            ).toBe(false);
        });

        it('Should return false because the user is Drive plus for Mail offer', () => {
            mockUseFeature.mockReturnValue(featureEnabled);
            mockUseConfig.mockReturnValue(defaultConfigMail);
            mockUseFlag.mockReturnValue(true);
            mockUseSubscription.mockReturnValue([
                {
                    PeriodStart: subDays(today.getTime(), 25).getTime() / 1000,
                    Cycle: CYCLE.MONTHLY,
                    Plans: [{ Name: PLANS.DRIVE }],
                    UpcomingSubscription: { Cycle: CYCLE.MONTHLY },
                } as unknown as Subscription,
            ]);

            expect(
                useMonthlyUpsellEligibility({
                    allowedApps: paidConfig[PLANS.MAIL].allowedApps,
                    offerTimestampFlag: paidConfig[PLANS.MAIL].offerTimestampFlag,
                    offerFlag: paidConfig[PLANS.MAIL].offerFlag,
                    eligiblePlan: paidConfig[PLANS.MAIL].currentPlan,
                })
            ).toBe(false);
        });

        it('Should return true because the user is Mail plus for Mail offer', () => {
            mockUseFeature.mockReturnValue(featureEnabled);
            mockUseConfig.mockReturnValue(defaultConfigMail);
            mockUseFlag.mockReturnValue(true);
            mockUseSubscription.mockReturnValue([
                {
                    PeriodStart: subDays(today.getTime(), 25).getTime() / 1000,
                    Cycle: CYCLE.MONTHLY,
                    Plans: [{ Name: PLANS.MAIL }],
                    UpcomingSubscription: { Cycle: CYCLE.MONTHLY },
                } as unknown as Subscription,
            ]);

            expect(
                useMonthlyUpsellEligibility({
                    allowedApps: paidConfig[PLANS.MAIL].allowedApps,
                    offerTimestampFlag: paidConfig[PLANS.MAIL].offerTimestampFlag,
                    offerFlag: paidConfig[PLANS.MAIL].offerFlag,
                    eligiblePlan: paidConfig[PLANS.MAIL].currentPlan,
                })
            ).toBe(true);
        });

        it('Should return true because user has upcoming monthly subcription', () => {
            mockUseFeature.mockReturnValue(featureEnabled);
            mockUseConfig.mockReturnValue(defaultConfigMail);
            mockUseFlag.mockReturnValue(true);
            mockUseSubscription.mockReturnValue([
                {
                    PeriodStart: subDays(today.getTime(), 25).getTime() / 1000,
                    Cycle: CYCLE.MONTHLY,
                    Plans: [{ Name: PLANS.MAIL }],
                    UpcomingSubscription: { Cycle: CYCLE.MONTHLY },
                } as unknown as Subscription,
            ]);

            expect(
                useMonthlyUpsellEligibility({
                    allowedApps: paidConfig[PLANS.MAIL].allowedApps,
                    offerTimestampFlag: paidConfig[PLANS.MAIL].offerTimestampFlag,
                    offerFlag: paidConfig[PLANS.MAIL].offerFlag,
                    eligiblePlan: paidConfig[PLANS.MAIL].currentPlan,
                })
            ).toBe(true);
        });

        it('Should return true because user has migration coupon', () => {
            mockUseFeature.mockReturnValue(featureEnabled);
            mockUseConfig.mockReturnValue(defaultConfigMail);
            mockUseFlag.mockReturnValue(true);
            mockUseSubscription.mockReturnValue([
                {
                    PeriodStart: subDays(today.getTime(), 25).getTime() / 1000,
                    Cycle: CYCLE.MONTHLY,
                    Plans: [{ Name: PLANS.MAIL }],
                    Coupon: { Name: 'MIGRATION' },
                } as unknown as Subscription,
            ]);

            expect(
                useMonthlyUpsellEligibility({
                    allowedApps: paidConfig[PLANS.MAIL].allowedApps,
                    offerTimestampFlag: paidConfig[PLANS.MAIL].offerTimestampFlag,
                    offerFlag: paidConfig[PLANS.MAIL].offerFlag,
                    eligiblePlan: paidConfig[PLANS.MAIL].currentPlan,
                })
            ).toBe(true);
        });
    });
});
