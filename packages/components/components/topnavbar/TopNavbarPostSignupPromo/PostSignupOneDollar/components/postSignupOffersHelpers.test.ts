import { subDays } from 'date-fns';

import { AUTOMATIC_OFFER_STATE, EXTENDED_REMINDER_DAY, LAST_REMINDER_DAY } from './interface';
import { shouldOpenPostSignupOffer, updatePostSignupOpenOfferState } from './postSignupOffersHelpers';

describe('Post Signup offer helpers', () => {
    describe('Should open offer helper', () => {
        it('Should return false if empty object', () => {
            // @ts-ignore
            expect(shouldOpenPostSignupOffer({})).toBeFalsy();
        });

        it('Should return false if no offer date and reminder undefined', () => {
            expect(
                shouldOpenPostSignupOffer({
                    offerStartDate: 0,
                    // @ts-ignore
                    automaticOfferReminders: undefined,
                })
            ).toBeFalsy();
        });

        it('Should return true if no offer date and not started', () => {
            expect(
                shouldOpenPostSignupOffer({
                    offerStartDate: 0,
                    automaticOfferReminders: AUTOMATIC_OFFER_STATE.notStarted,
                })
            ).toBeTruthy();
        });

        it('Should return false if offer is not 25 days old and first spotlight seen', () => {
            expect(
                shouldOpenPostSignupOffer({
                    offerStartDate: subDays(new Date(), EXTENDED_REMINDER_DAY - 5).getTime() / 1000,
                    automaticOfferReminders: AUTOMATIC_OFFER_STATE.firstSpotlight,
                })
            ).toBeFalsy();
        });

        it('Should return true if offer date is 25 days old and first spotlight seen', () => {
            expect(
                shouldOpenPostSignupOffer({
                    offerStartDate: subDays(new Date(), EXTENDED_REMINDER_DAY).getTime() / 1000,
                    automaticOfferReminders: AUTOMATIC_OFFER_STATE.firstSpotlight,
                })
            ).toBeTruthy();
        });

        it('Should return false if offer date is not 29 days old and second spotlight seen', () => {
            expect(
                shouldOpenPostSignupOffer({
                    offerStartDate: subDays(new Date(), LAST_REMINDER_DAY - 5).getTime() / 1000,
                    automaticOfferReminders: AUTOMATIC_OFFER_STATE.secondSpotlight,
                })
            ).toBeFalsy();
        });

        it('Should return true if offer date is 29 days old and second spotlight seen', () => {
            expect(
                shouldOpenPostSignupOffer({
                    offerStartDate: subDays(new Date(), LAST_REMINDER_DAY).getTime() / 1000,
                    automaticOfferReminders: AUTOMATIC_OFFER_STATE.secondSpotlight,
                })
            ).toBeTruthy();
        });

        it('Should return true if offer date is 25 days old and user still not started (should not happen)', () => {
            expect(
                shouldOpenPostSignupOffer({
                    offerStartDate: subDays(new Date(), EXTENDED_REMINDER_DAY).getTime() / 1000,
                    automaticOfferReminders: AUTOMATIC_OFFER_STATE.notStarted,
                })
            ).toBeTruthy();
        });
    });

    describe('Update offer state', () => {
        it('Should return default state', () => {
            expect(updatePostSignupOpenOfferState()).toStrictEqual({
                offerStartDate: 0,
                automaticOfferReminders: AUTOMATIC_OFFER_STATE.notStarted,
            });
        });

        it('Should return first spotlight state', () => {
            const result = updatePostSignupOpenOfferState({
                offerStartDate: 0,
                automaticOfferReminders: AUTOMATIC_OFFER_STATE.notStarted,
            });
            expect(result.automaticOfferReminders).toStrictEqual(AUTOMATIC_OFFER_STATE.firstSpotlight);
            expect(result.offerStartDate > 0).toBeTruthy();
        });

        it('Should return second spotlight state', () => {
            const offerStartDate = subDays(new Date(), EXTENDED_REMINDER_DAY).getTime() / 1000;
            const result = updatePostSignupOpenOfferState({
                offerStartDate,
                automaticOfferReminders: AUTOMATIC_OFFER_STATE.firstSpotlight,
            });
            expect(result.automaticOfferReminders).toStrictEqual(AUTOMATIC_OFFER_STATE.secondSpotlight);
            expect(result.offerStartDate).toBe(offerStartDate);
        });

        it('Should return last reminder state', () => {
            const offerStartDate = subDays(new Date(), LAST_REMINDER_DAY).getTime() / 1000;
            const result = updatePostSignupOpenOfferState({
                offerStartDate,
                automaticOfferReminders: AUTOMATIC_OFFER_STATE.secondSpotlight,
            });
            expect(result.automaticOfferReminders).toStrictEqual(AUTOMATIC_OFFER_STATE.lastReminder);
            expect(result.offerStartDate).toBe(offerStartDate);
        });

        it('Should return offer state if none match', () => {
            const offerStartDate = subDays(new Date(), 14).getTime() / 1000;
            const result = updatePostSignupOpenOfferState({
                offerStartDate,
                automaticOfferReminders: AUTOMATIC_OFFER_STATE.firstSpotlight,
            });
            expect(result.automaticOfferReminders).toStrictEqual(AUTOMATIC_OFFER_STATE.firstSpotlight);
            expect(result.offerStartDate).toBe(offerStartDate);
        });
    });
});
