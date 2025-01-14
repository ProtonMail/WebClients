import { PLANS } from '@proton/payments';
import { CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';
import { getShouldCalendarPreventSubscripitionChange, planHasPaidMail } from '@proton/shared/lib/calendar/plans';
import { buildUser } from '@proton/testing/builders';
import { getLongTestPlans } from '@proton/testing/data';
import noop from '@proton/utils/noop';

describe('calendar/plans', () => {
    describe('planHasPaidMail', () => {
        it('should return true if the new plan has paid mail', () => {
            const newPlan = { [PLANS.MAIL]: 1 };
            expect(planHasPaidMail(newPlan, getLongTestPlans())).toBe(true);
        });
    });

    describe('getShouldCalendarPreventSubscripitionChange', () => {
        it('should return false if the user has paid mail and buys pass lifetime', async () => {
            const user = buildUser({ hasPaidMail: true });
            const newPlan = { [PLANS.PASS_LIFETIME]: 1 };

            expect(
                await getShouldCalendarPreventSubscripitionChange({
                    user,
                    api: noop as any,
                    getCalendars: noop as any,
                    newPlan,
                    plans: getLongTestPlans(),
                })
            ).toBe(false);
        });

        it('should return false if the user buys paid mail', async () => {
            const user = buildUser({ hasPaidMail: false });
            const newPlan = { [PLANS.MAIL]: 1 };

            expect(
                await getShouldCalendarPreventSubscripitionChange({
                    user,
                    api: noop as any,
                    getCalendars: noop as any,
                    newPlan,
                    plans: getLongTestPlans(),
                })
            ).toBe(false);
        });

        it('should return true if user has too many calendars', async () => {
            const user = buildUser({ hasPaidMail: true });
            const newPlan = { [PLANS.DRIVE]: 1 };

            expect(
                await getShouldCalendarPreventSubscripitionChange({
                    user,
                    api: noop as any,
                    getCalendars: () =>
                        Promise.resolve([
                            {
                                ID: '1',
                                Type: CALENDAR_TYPE.PERSONAL,
                                Owner: { Email: 'example@proton.me' },
                                Members: [{ Email: 'example@proton.me' }],
                            },
                            {
                                ID: '2',
                                Type: CALENDAR_TYPE.PERSONAL,
                                Owner: { Email: 'example@proton.me' },
                                Members: [{ Email: 'example@proton.me' }],
                            },
                            {
                                ID: '3',
                                Type: CALENDAR_TYPE.PERSONAL,
                                Owner: { Email: 'example@proton.me' },
                                Members: [{ Email: 'example@proton.me' }],
                            },
                            {
                                ID: '4',
                                Type: CALENDAR_TYPE.PERSONAL,
                                Owner: { Email: 'example@proton.me' },
                                Members: [{ Email: 'example@proton.me' }],
                            },
                        ] as any),
                    newPlan,
                    plans: getLongTestPlans(),
                })
            ).toBe(true);
        });
    });
});
