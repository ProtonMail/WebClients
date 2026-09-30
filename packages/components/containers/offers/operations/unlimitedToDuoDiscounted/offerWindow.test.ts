import { CYCLE } from '@proton/payments/core/constants';

import { isInOfferWindow } from './offerWindow';

describe('isInOfferWindow', () => {
    describe('12-month cycle, window 305-365', () => {
        it.each([305, 306, 335, 364, 365])('is eligible on day %i', (day) => {
            expect(isInOfferWindow(CYCLE.YEARLY, day)).toBe(true);
        });

        it.each([0, 1, 304, 366, 400])('is not eligible on day %i', (day) => {
            expect(isInOfferWindow(CYCLE.YEARLY, day)).toBe(false);
        });
    });

    describe('24-month cycle, windows 220-280 and 670-730', () => {
        it.each([220, 250, 280, 670, 700, 730])('is eligible on day %i', (day) => {
            expect(isInOfferWindow(CYCLE.TWO_YEARS, day)).toBe(true);
        });

        it.each([219, 281, 669, 731])('is not eligible on boundary-adjacent day %i', (day) => {
            expect(isInOfferWindow(CYCLE.TWO_YEARS, day)).toBe(false);
        });

        it('is not eligible in the gap between the two windows', () => {
            expect(isInOfferWindow(CYCLE.TWO_YEARS, 450)).toBe(false);
        });
    });

    describe('cycles without a window', () => {
        it.each([CYCLE.MONTHLY, CYCLE.THREE, CYCLE.SIX, CYCLE.FIFTEEN, CYCLE.EIGHTEEN, CYCLE.THIRTY])(
            'is never eligible on cycle %i',
            (cycle) => {
                expect(isInOfferWindow(cycle, 305)).toBe(false);
                expect(isInOfferWindow(cycle, 250)).toBe(false);
            }
        );

        it('is not eligible when the cycle is unknown', () => {
            expect(isInOfferWindow(undefined, 330)).toBe(false);
        });
    });
});
