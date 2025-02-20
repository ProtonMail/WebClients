import { subDays } from 'date-fns';

import { CYCLE, PLANS } from '@proton/payments';
import type { ProtonConfig, Subscription } from '@proton/shared/lib/interfaces';

import { getIsElligibleForNudge } from './mailPaidUserNudgeHelper';

const today = new Date();
const protonConfig = { APP_NAME: 'proton-mail' } as unknown as ProtonConfig;

describe('Mail Paid user nudge', () => {
    it('should not be eligible since hideOffer is true', () => {
        expect(
            getIsElligibleForNudge({
                config: protonConfig,
                subscription: {
                    PeriodStart: subDays(today.getTime(), 25).getTime() / 1000,
                    Cycle: CYCLE.MONTHLY,
                    Plans: [{ Name: PLANS.MAIL }],
                } as unknown as Subscription,
                hideOffer: true,
                flag: true,
            })
        ).toBeFalsy();
    });

    it('should not be eligible since flag is off', () => {
        expect(
            getIsElligibleForNudge({
                config: protonConfig,
                subscription: {
                    PeriodStart: subDays(today.getTime(), 25).getTime() / 1000,
                    Cycle: CYCLE.MONTHLY,
                    Plans: [{ Name: PLANS.MAIL }],
                } as unknown as Subscription,
                hideOffer: true,
                flag: false,
            })
        ).toBeFalsy();
    });

    it('should not be eligible since cycle not monthly', () => {
        expect(
            getIsElligibleForNudge({
                config: protonConfig,
                subscription: {
                    PeriodStart: subDays(today.getTime(), 25).getTime() / 1000,
                    Cycle: CYCLE.YEARLY,
                    Plans: [{ Name: PLANS.MAIL }],
                } as unknown as Subscription,
                hideOffer: true,
                flag: true,
            })
        ).toBeFalsy();
    });

    it('should not be eligible since cycle not mail plus', () => {
        expect(
            getIsElligibleForNudge({
                config: protonConfig,
                subscription: {
                    PeriodStart: subDays(today.getTime(), 25).getTime() / 1000,
                    Cycle: CYCLE.MONTHLY,
                    Plans: [{ Name: PLANS.DRIVE }],
                } as unknown as Subscription,
                hideOffer: true,
                flag: true,
            })
        ).toBeFalsy();
    });

    it('should not be eligible since cycle not in proton-mail', () => {
        expect(
            getIsElligibleForNudge({
                config: { APP_NAME: 'proton-drive' } as unknown as ProtonConfig,
                subscription: {
                    PeriodStart: subDays(today.getTime(), 25).getTime() / 1000,
                    Cycle: CYCLE.MONTHLY,
                    Plans: [{ Name: PLANS.DRIVE }],
                } as unknown as Subscription,
                hideOffer: true,
                flag: true,
            })
        ).toBeFalsy();
    });
});
