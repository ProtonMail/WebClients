import { getUnixTime, subDays } from 'date-fns';

import { ZERO_NINETY_NINE_OFFER_STATE } from './interface';
import {
    getZeroNinetyNineOfferAgeCategory,
    isZeroNinetyNineStateTheSame,
    shouldOpenZeroNinetyNineOffer,
    updateZeroNinetyNineOfferState,
} from './zeroNinetyNineOfferState';

const daysAgo = (days: number) => getUnixTime(subDays(new Date(), days));

describe('0.99 offer state', () => {
    describe('shouldOpenZeroNinetyNineOffer', () => {
        it('should not open without any state', () => {
            expect(shouldOpenZeroNinetyNineOffer(undefined)).toBeFalsy();
        });

        it('should open the first time eligibility is met', () => {
            expect(
                shouldOpenZeroNinetyNineOffer({
                    offerStartDate: 0,
                    automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.notStarted,
                })
            ).toBeTruthy();
        });

        it('should not reopen before day 25', () => {
            expect(
                shouldOpenZeroNinetyNineOffer({
                    offerStartDate: daysAgo(24),
                    automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.firstSpotlight,
                })
            ).toBeFalsy();
        });

        it('should reopen on day 25 as the second spotlight', () => {
            expect(
                shouldOpenZeroNinetyNineOffer({
                    offerStartDate: daysAgo(25),
                    automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.firstSpotlight,
                })
            ).toBeTruthy();
        });

        it('should not reopen on day 25 if already seen', () => {
            expect(
                shouldOpenZeroNinetyNineOffer({
                    offerStartDate: daysAgo(25),
                    automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.secondSpotlight,
                })
            ).toBeFalsy();
        });

        it('should reopen on day 29 as the last reminder', () => {
            expect(
                shouldOpenZeroNinetyNineOffer({
                    offerStartDate: daysAgo(29),
                    automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.secondSpotlight,
                })
            ).toBeTruthy();
        });

        it('should never open after day 30', () => {
            expect(
                shouldOpenZeroNinetyNineOffer({
                    offerStartDate: daysAgo(31),
                    automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.secondSpotlight,
                })
            ).toBeFalsy();
        });
    });

    describe('updateZeroNinetyNineOfferState', () => {
        it('should return an unstarted state when there is none', () => {
            expect(updateZeroNinetyNineOfferState(undefined)).toEqual({
                offerStartDate: 0,
                automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.notStarted,
            });
        });

        it('should stamp the start date on first close', () => {
            const result = updateZeroNinetyNineOfferState({
                offerStartDate: 0,
                automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.notStarted,
            });

            expect(result.offerStartDate).toBeGreaterThan(0);
            expect(result.automaticOfferReminders).toBe(ZERO_NINETY_NINE_OFFER_STATE.firstSpotlight);
        });

        it('should advance to the second spotlight on day 25', () => {
            const offerStartDate = daysAgo(25);

            expect(
                updateZeroNinetyNineOfferState({
                    offerStartDate,
                    automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.firstSpotlight,
                })
            ).toEqual({
                offerStartDate,
                automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.secondSpotlight,
            });
        });

        it('should advance to the last reminder on day 29', () => {
            const offerStartDate = daysAgo(29);

            expect(
                updateZeroNinetyNineOfferState({
                    offerStartDate,
                    automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.secondSpotlight,
                })
            ).toEqual({
                offerStartDate,
                automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.lastReminder,
            });
        });

        it('should leave the state untouched between reminders', () => {
            const state = {
                offerStartDate: daysAgo(10),
                automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.firstSpotlight,
            };

            expect(updateZeroNinetyNineOfferState(state)).toEqual(state);
        });
    });

    describe('isZeroNinetyNineStateTheSame', () => {
        it('should detect an unchanged state so no needless write is made', () => {
            const state = {
                offerStartDate: 100,
                automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.firstSpotlight,
            };

            expect(isZeroNinetyNineStateTheSame(state, state)).toBeTruthy();
        });

        it('should detect a changed state', () => {
            expect(
                isZeroNinetyNineStateTheSame(
                    { offerStartDate: 100, automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.secondSpotlight },
                    { offerStartDate: 100, automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.firstSpotlight }
                )
            ).toBeFalsy();
        });
    });

    describe('getZeroNinetyNineOfferAgeCategory', () => {
        it.each([
            [-1, '0-4'],
            [0, '0-4'],
            [4, '0-4'],
            [5, '5-9'],
            [9, '5-9'],
            [10, '10-14'],
            [14, '10-14'],
            [15, '15-19'],
            [19, '15-19'],
            [20, '20-24'],
            [24, '20-24'],
            [25, '25-30'],
            [30, '25-30'],
        ])('should bucket day %i as %s', (day, expected) => {
            expect(getZeroNinetyNineOfferAgeCategory(day)).toBe(expected);
        });
    });
});
